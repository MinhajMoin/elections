function SimplePromise(){
	this.fulfillReactions = [];
  this.rejectReactions = [];
  this.promiseResult = undefined;
  this.promiseState = 'pending';
}

SimplePromise.prototype = {
	then : function(onFulfilled, onRejected){
		var returnValue = new SimplePromise();
    var self = this;

    var fulfilledTask;
    if (typeof onFulfilled === 'function') {
        fulfilledTask = function () {
            var res = onFulfilled(self.promiseResult);
            returnValue.resolve(res);
        };
    } else {
        fulfilledTask = function () {
            returnValue.resolve(self.promiseResult);
        };
    }

    var rejectedTask;
    if (typeof onRejected === 'function') {
        rejectedTask = function () {
            var res = onRejected(self.promiseResult);
            returnValue.resolve(res);
        };
    } else {
        rejectedTask = function () {
            returnValue.reject(self.promiseResult);
        };
    }

    switch (this.promiseState) {
      case 'pending':
          this.fulfillReactions.push(fulfilledTask);
          this.rejectReactions.push(rejectedTask);
          break;
      case 'fulfilled':
          addToTaskQueue(fulfilledTask);
          break;
      case 'rejected':
          addToTaskQueue(rejectedTask);
          break;
  	}
  	return returnValue;
	},
	resolve : function(value) {
      if (this.promiseState !== 'pending') return;
      if (this.alreadyResolved) return;
	    this.alreadyResolved = true;
	    this._doResolve(value);
	    return this; // enable chaining
    },
  _clearAndEnqueueReactions : function(reactions) {
        this.fulfillReactions = undefined;
        this.rejectReactions = undefined;
        reactions.map(addToTaskQueue);
    },
  _doResolve : function(value) {
    var self = this;
    // Is `value` a thenable?
    if (typeof value === 'object' && value !== null && 'then' in value) {
      // Forward fulfillments and rejections from `value` to `this`.
      // Added as a task (versus done immediately) to preserve async semantics.
      addToTaskQueue(function () { // (A)
          value.then(
              function onFulfilled(result) {
                  self._doResolve(result);
              },
              function onRejected(error) {
                  self._doReject(error);
              });
      });
    } else {
      this.promiseState = 'fulfilled';
      this.promiseResult = value;
      this._clearAndEnqueueReactions(this.fulfillReactions);
    }
	},
	reject : function(error) {
    if (this.alreadyResolved) return;
    this.alreadyResolved = true;
    this._doReject(error);
    return this; // enable chaining
	},
  _doReject : function(error) {
    this.promiseState = 'rejected';
    this.promiseResult = error;
    this._clearAndEnqueueReactions(this.rejectReactions);
   }
};

function addToTaskQueue(task) {
  setTimeout(task, 0);
}

function makeProvMaps(){
  var map_block = d3.select("#vizcontain")

  // width and height of the svg viewport
  var width = 1000, height = 600;

  // getting height and width of svg on full screen on mac
  var mac_pro_height = 679.234375;
  var mac_pro_width = 720;

  // giving some padding
  var height_pad = 60;
  var width_pad = 60;

  // calculating ultimate width and height
  var height = mac_pro_height - height_pad
  var width = mac_pro_width - width_pad;

  // constant scale (pick the one calculated for balochistan, so that scale is constant for all provinces)
  var scale = 1.770600970553169;

  // defining the projection for map (change center and scale to get desired size for the map)
  var projection = d3.geoMercator()
      .center([75, 31.5])
      .scale([150 * 13]);

  // defining the paths for the maps
  var path = d3.geoPath().projection(projection);

  function removeAllDisplay(){
    // remove all contents of viz
    d3.select("#vizcontain")
      .selectAll('*')
      .remove()

    // remove all contents of legend
    d3.select("#legendcontain")
      .selectAll('*')
      .remove()

    d3.select('#barsvg')
      .remove()
  }

  removeAllDisplay();
  makeSummBar(PK_summary);

  // defining the svg view port for the map within the div
  var svg = map_block.append("svg")
                    // .attr("width", width)
                    // .attr("height", height)
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    //.attr("viewBox", "0 0 1000 600")
                    .attr("viewBox", "0 0 636 600")
                    .style("fill-opacity", 1)
                    .classed("map_in_a_box", "true")

  var svg_g = svg.append("g")
                .classed("map_group_province", "true");

	var status_message = svg.append("text")
                      .attr("id", "status_message")
                      .attr('x', '50%')
                      .attr('y', 10)
                      .style('text-anchor', 'middle')
                      .style('fill', '#D32F2F')
                      .style('font-size', '12px')
                      .text('Please wait for the layout to stabilize')

  var q = d3.queue();
    q.defer(d3.json, "./essentials/pakistan_districts.topojson")
    q.defer(d3.json, "./essentials/Pak_prov.topojson")
    q.defer(d3.json, "./essentials/prov2013.json")
    q.defer(d3.csv, "./essentials/prov_seats_2013.csv")
    q.await(drawProvincial)

  // listing the parties from na map
  var parties = [
    "Pakistan Tehreek-e-Insaf",
    "Jamiat Ulama-e-Islam (F)",
    "Qaumi Watan Party (Sherpao)",
    "Awami National Party",
    "Awami Jamhuri Ittehad Pakistan",
    "Pakistan Muslim League (N)",
    "Independent",
    "Jamaat-e-Islami Pakistan",
    "All Pakistan Muslim League",
    "Awami Muslim League Pakistan",
    "Pakistan Muslim League",
    "Pakistan Muslim League(Z)",
    "Pakistan Peoples Party Parliamentarians",
    "National Peoples Party",
    "Pakistan Muslim League (F)",
    "Muttahida Qaumi Movement Pakistan",
    "Pashtoonkhwa Milli Awami Party",
    "National Party",
    "Balochistan National Party"
  ];

  // defining colors mapping to parties / other color is mapped to multiple parties
  // color mapping is the same as na map
  var other_color = "#03A9F4";

  var party_colors = [
    "#9C27B0",
    "#4DB6AC",
    other_color,
    other_color,
    other_color,
    "#81C784",
    "#CDDC39",
    other_color,
    other_color,
    other_color,
    "#4DD0E1",
    other_color,
    "#607D8B",
    other_color,
    "#FF8A65",
    "#BDBDBD",
    other_color,
    other_color,
    other_color
  ];

  // defining categorical color scale
  var colorScale = d3.scaleOrdinal()
                     .domain(parties)
                     .range(party_colors);

  function drawProvincial(error, topology, prov_topology, prov2013, prov_seats_2013){

		d3.selectAll("#NA, #dwvs, #flow")
			.attr('disabled', true)

		if (error) {
			throw error;
		}

		else {

			var zoom = d3.zoom()
				// no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
				// .translate([0, 0])
				// .scale(1)
				.scaleExtent([1, 8])
				.on("zoom", zoomed);

			var provAbb = {
				"Federally Administered Tribal Areas": "FATA",
				"Sindh": "Sindh",
				"Khyber Pakhtunkhwa": "KP",
				"Balochistan": "Balochistan",
				"Punjab": "Punjab",
				"Azad Jammu & Kashmir": "AJK",
				"Gilgit-Baltistan": "GB",
				"Islamabad Capital Territory": "ICT"
			}

	    var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
	    var prov_path_data = topojson.feature(prov_topology, prov_topology.objects.Pak_prov).features;

	    // drawing paths of all districts within a g classed 'pakDistricts'
	    svg_g.append("g")
	          .classed("pakDistricts", true)
	          .selectAll("path")
	          .data(path_data)
	          .enter().append("path")
	          .attr("d", function (d, i){ return path(d)})
	          .style("stroke", "black")
	          .style("stroke-width", 0.2)
	          .style("fill", "#FFF")
	          .style("fill-opacity", 0.9)
	          //.attr("district", d => d.properties.districts)
	          .attr("class", function(d, i){
	            return whiteSpaceRem(d.properties.districts);
	          })
	          .classed("district", true);

	    svg_g.append("g")
	          .classed("pakProvs", true)
	          .selectAll("path")
	          .data(prov_path_data)
	          .enter().append("path")
	          .attr("d", function (d, i){ return path(d)})
	          .style("stroke", "black")
	          .style("stroke-width", 0)
	          .style("fill", "#FFF")
	          .style("fill-opacity", 1)
	          //.attr("district", d => d.properties.districts)
	          .attr("prov", function(d, i){
	            return d.properties.province_territory;
	          })
	          .attr('class', d => provAbb[d.properties.province_territory])
	          .classed("province", true);

	    //////////////////////////////////////////////////
	    ////////////// Data Pre-processing  //////////////
	    //////////////////////////////////////////////////

	    // comprehensive results by joining the scraped data with basic info of na_seats
	    var result = join(prov_seats_2013, prov2013, "seat", "seat", function(election_row, seat_row) {
	      return {
	          seat: seat_row['seat'],
	          PrimaryDistrict: seat_row.district,
	          //SeconDistrict: seat_row.SeconDistrict,
	          province: seat_row.province,
	          "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
	          "Registered Votes": election_row['Registered Votes'],
	          "Rejected Votes": election_row['Rejected Votes'],
	          "Valid Votes": election_row['Valid Votes'],
	          "Votes Polled": election_row['Votes Polled'],
	          results: election_row['results']
	      }
	    });



	    const base_bubble = 3 * 0.7 // min size that all bubbles take
	    const margin_range = 5 * 0.7 // range for vote margin

	    var y_offset_tx = - 60;

	    // adding vote margin and radius and init radius to results
	    result.forEach(function(d){
	      //console.log(d.results[0].votes);
	      d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
	      d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
	      d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);
				var vote_turnOut_txt = 'Percentage of Votes Polled to Registered Voters';
        d[vote_turnOut_txt] = (d[vote_turnOut_txt] != 0) ? d[vote_turnOut_txt] : round2Dec((d["Valid Votes"]/ d["Registered Votes"]) * 100, 2);
	    })

	    // getting district Centroids using the distCentroids function
	    var centroids = distCentroids(path_data);

	    // adding initial x and y positions of seats/ nodes (start of the force simulation)
	    result.forEach(function(d){
	      d.x = getCentroid(d.PrimaryDistrict)[0];
	      d.y = getCentroid(d.PrimaryDistrict)[1];
	    });


	    // assigning results to nodes
	    var nodes_prov = result;


	    /////////////////////////////////////////////////////////
	    ////////////// Setting up force simulation //////////////
	    /////////////////////////////////////////////////////////

	    // force with charge, forceX, forceY and collision detection

	    var simulation_prov = d3.forceSimulation(nodes_prov)
	                      .force('charge', d3.forceManyBody().strength(0.3))
	                      .force('x', d3.forceX().x(function(d) {
	                        return getCentroid(d.PrimaryDistrict)[0];
	                      }))
	                      .force('y', d3.forceY().y(function(d) {
	                        return getCentroid(d.PrimaryDistrict)[1];
	                      }))
	                      .force('collision', d3.forceCollide().radius(function(d) {
	                        return d.radius + 0.65;
	                      }))
	                      .on('tick', ticked_prov)
	                      .alpha(0.525)
	                      .alphaDecay(0.07)
	                      .on('end', function() {
													end_force();
													d3.select('#status_message')
														.text('All set')
														.style('fill', '#1976D2')
														.transition('status_trans')
														.delay(2500)
														.duration(1500)
														.style('fill-opacity', 0);

												setTimeout(function(){ $("#filterdropdown").show().addClass('animated fadeInDefault').css('display', 'flex');; }, 1000);
												setTimeout(function(){ $("#dropdownProvinceLink").show().addClass('animated fadeInDefault'); }, 1000);

												setTimeout(function(){ $("#partyFilters").show().addClass('animated fadeInDefault').css('display', 'flex'); }, 1250);

											})


	      // a group containing all na seat circles
	      var u = svg.append('g')
	                  .classed('na-seats-group', true)
	                  .selectAll('.pSeat') // .selectAll('circle')
	                  .data(nodes_prov)

	      // entering all nodes // bubbles
	      // initializing position of nodes
	      u.enter()
	        .append('g')
	        .attr('class', d => d.seat)
	        .classed('pSeat_g', true)
	        .append('circle')
	        .attr("class", d => d.province)
	        .classed("pSeatCircle", true)
	        .classed('2013', true)
	        .merge(u)
	        .attr('cx', function(d) {
	          return d.x;
	        })
	        .attr('cy', function(d) {
	          return d.y;
	        })
	       .style("fill", function(d){
	          return colorScale(d.results[0].party);
	        })
	       .style("opacity", 0)
	        //.style("opacity", d => (d.province == "KP") ? 1 : 0)
	        .style("display", d => (d.province == "KP") ? "block" : "none")
	        .attr("party", function(d){
	          return d.results[0].party;
	        })
	        .attr("id", function(d){
	          return d.seat;
	        })
	        .attr('r', 0)
	        .transition('bubble_up')
	        .duration(1000)
	        .ease(d3.easePoly)
	        .attr('r', function(d, i){
	          radius = base_bubble + ((d.voteMargin/ 100) * margin_range)
	          //console.log(is.nan(radius) ? "Problem!" : "")
	          return radius;

	        })

	      // removing the exit selection
	      u.exit().remove()


	      var voronoi_prov = d3.voronoi()
	                        .x(d => d.x) // with some noise on x and y centers
	                        .y(d => d.y)
	                        .extent([[0, 0], [width, height]]);





	      function redrawPolygon(polygon) {
	            polygon
	                .attr("d", function(d) { return d ? "M" + d.join(",") + "Z" : null; })
	      }


	    function end_force(){

	        // making clip circles over the seat circles
	        //Append larger circles (that are clipped by clipPaths)
	        svg.append('g').classed('clip-circles-prov', true)
	            .selectAll(".circle-catcher.pMap")
	            .data(nodes_prov)
	            .enter().append("circle")
	            .attr("class", function(d,i) { return "circle-catcher pMap " + d.seat; })
	            //Apply the clipPath element by referencing the one with the same countryCode
	            .attr("clip-path", function(d, i) { return "url(#clip" + d.seat + ")"; })
	            //Bottom line for safari, which doesn't accept attr for clip-path
	            .style("clip-path", function(d, i) { return "url(#clip" + d.seat + ")"; })
	            .attr("cx", d => d.x)
	            .attr("cy", d => d.y)
	            //Make the radius a lot bigger
	            .attr("r", 14)
	            .style("fill", "none")
	            //.style("fill-opacity", 0.5)
	            .style("pointer-events", "all")
	            .style("display", d => (d.province == "KP") ? "block" : "none")
	            .on("mouseover", activateMouseOv)
	            .on("mouseout", activateMouseOut);

	        translate = [-345.4863342221814,54.93697529051545 + y_offset_tx];

	        d3.selectAll(".circle-catcher.pMap")
	          .style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)");

	      //  console.log(nodes)
	      //  console.log(voronoi.polygons(nodes))

	        var polygon =  svg.append("defs")
	                          .selectAll(".clip")
	                          .data(voronoi_prov.polygons(nodes_prov))
	                          //First append a clipPath element
	                          .enter().append("clipPath")
	                          .attr("class", "clip")
	                          //Make sure each clipPath will have a unique id (connected to the circle element)
	                          .attr("id", d => (d != null) ? "clip" + d.data.seat : "clip" + "P")
	                          //Then append a path element that will define the shape of the clipPath
	                          .append("path")
	                          .attr("class", "clip-path-circle")
	                          .call(redrawPolygon);

	          filterCirclesPr(["KP"])

						d3.selectAll("#NA, #dwvs, #flow")
							.attr('disabled', null)
	    }

	    function ticked_prov() {
	           // updating the circle positions
	           d3.selectAll(".pSeatCircle")
	             .attr('cx', function(d) {
	               return d.x
	             })
	             .attr('cy', function(d) {
	               return d.y
	             })
	       }

	    makeProvMap("KP", "init")

	    function activateMouseOv(d, i){
	      // extract unique class of the hovered voronoi cell (replace "circle-catcher " to get seat)
	      var unique_class = d3.select(this).attr('class').replace("circle-catcher pMap ", "");
	      // selecting the circle with the gotten id (first select group then circle)
	      var circle_group = d3.select('g' + "." + unique_class)
	      var circle_select = circle_group.select('circle');

	      // raise the selected group
	      circle_group.raise();

	      // defining transition in the na circles
	      circle_select
	       .transition()
	       .ease(d3.easeElastic)
	       .duration(1700)
	       .tween('radius', function(d) {
	         var that = d3.select(this);
	         var i = d3.interpolate(d.radius, 5.5);
	         return function(t) {
	           d.radius = i(t);
	           that.attr('r', function(d) { return d.radius; });
	           //simulation.nodes(nodes)
	         }
	       })
	       .attr('fill', function(d){
	         return d3.rgb(colorScale(d.results[0].party)).darker();
	       })
	       .attr('stroke', function(d){
	         return d3.rgb(colorScale(d.results[0].party)).darker();
	       })
	       .attr('stroke-width', 0.75);

	       datum = circle_select.data()[0];
	       color = colorScale(datum.results[0].party);

	       // append tooltip
	       d3.select('body').append('div')
	         .classed('animated', true)
	         .classed('zoomIn', true)
	         .classed('tool', true)
	         .attr('id', 'hoverbox')
	       // tooltip selection
	       var tooltip = d3.select('.tool');

	       tooltip.append('div')
	       .classed('toolhead', true)
	       .html(function(d){
	         return '<span class="NA">' + datum.seat + ' </span><span class="turnout">(' + datum["Percentage of Votes Polled to Registered Voters"] + '% voter turnout)</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('partyicon', true)
	       .html(image(datum.results[0].party));

	       tooltip.append('div')
	       .classed('toolhead', true)
	       .html(function(d){
	         return '<span class="dist">District: </span><span class="turnout">' + datum.PrimaryDistrict + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('nametitle', true)
	       .html(function(d){
	         return '<span>Name</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('partytitle', true)
	       .html(function(d){
	         return '<span>Party</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('voteTitle', true)
	       .html(function(d){
	         return '<span>Votes</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       //colored bar on top of tooltip showing the victorious party
	       tooltip.append('div')
	       .classed('partyColorToolBar', true)
	       .style('background-color', color)

	       tooltip.append('div')
	       .classed('candidatename', true)
	       .html(function(d){
	         return '<span>' + titleCase(datum.results[0].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('partyname', true)
	       .html(function(d){
	         return '<span>' + abbreviate(datum.results[0].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('votes', true)
	       .html(function(d){
	         return '<span>' + datum.results[0].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('candidatename', true)
	       .html(function(d){
	         return '<span>' + titleCase(datum.results[1].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('partyname', true)
	       .html(function(d){
	         return '<span>' + abbreviate(datum.results[1].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('votes', true)
	       .html(function(d){
	         return '<span>' + datum.results[1].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       tooltip.append('div')
	       .classed('candidatename', true)
	       .html(function(d){
	         return '<span class="mobiletoolremove">' + titleCase(datum.results[2].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('partyname', true)
	       .html(function(d){
	         return '<span class="mobiletoolremove">' + abbreviate(datum.results[2].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })
	       tooltip.append('div')
	       .classed('votes', true)
	       .html(function(d){
	         return '<span class="mobiletoolremove">' + datum.results[2].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
	       })

	       // positioning the tooltip

	       if (d3.event.pageY >= 460) {
	         var hoverbox = document.getElementById('hoverbox');
	         tooltip.style('top', d3.event.pageY - hoverbox.offsetHeight - 18 + "px")
	         if (d3.event.pageX - 125 < 0) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else if (d3.event.pageX + 125 > window.innerWidth) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else if (window.innerWidth < 450) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else {
	           tooltip.style('left', d3.event.pageX - 125 + "px")
	         }
	       }
	       else {
	         tooltip.style('top', d3.event.pageY + 14 + "px")
	         if (d3.event.pageX - 125 < 0) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else if (d3.event.pageX + 125 > window.innerWidth) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else if (window.innerWidth < 450) {
	           tooltip.style('left', window.innerWidth/2 - 125 + "px")
	         }
	         else {
	           tooltip.style('left', d3.event.pageX - 125 + "px")
	         }
	       }
	    }

	    function activateMouseOut(d, i){
	        // retrieve unique class of voronoi circle catcher
	        var unique_class = d3.select(this).attr('class').replace("circle-catcher pMap ", "");
	        // select the circle with the gotten id
	        circle_select = d3.select("circle" + "#" + unique_class);

	        // transition the circle back
	        circle_select
	          .transition()
	          .ease(d3.easeElastic)
	          .duration(1200)
	          .tween('radius', function(d) {
	            var that = d3.select(this);
	            var i = d3.interpolate(d.radius, d.radiusInit);
	            return function(t) {
	              d.radius = i(t);
	              that.attr('r', d => (d.radius >=0) ? d.radius : 0 );
	              //simulation.nodes(nodes)
	            }
	          })
	          .attr('fill', function(d){
	            return colorScale(d.results[0].party);
	          })
	          .attr('stroke', function(d){
	            d3.rgb(colorScale(d.results[0].party));
	          })
	          .attr('stroke-width', 0);

	          // remove the tooltip
	          d3.selectAll('.tool').remove()
	    }

	    function waitForAllTransitions(transition, callback) {
		    var n = 0;
		    transition
		        .on("start",function() { ++n; })
		        .on("end", function() { if (!--n) {
		        	callback.apply(this, arguments);
		        }
		    });
	  	}

	  	function removeInactiveCircles(inactive_circles){

	  		var sp = new SimplePromise();
	  		inactive_circles.transition('circle_trans')
	      .duration(300)
	      .attr('r', '0').call(waitForAllTransitions,
	      	function(){
	      		sp.resolve();
	      })

	      return sp;
	  	}

	  	function repaintStrokes(inactive, active){

	  		var sp = new SimplePromise();

	  		inactive.transition('map_move')
				.duration(200)
				.style('stroke-width', 0)

				active.transition('map_move')
	      .duration(0)
	      .style('stroke-width', 0.75)
	      .style('stroke', 'grey')
	      .style('fill', 'white').call(waitForAllTransitions,
	      	function(){
	      		sp.resolve();
	      })

	      return sp;
	  	}

	  	function setActiveCircleRadius(active_circles){

	  		var sp = new SimplePromise();

				active_circles.transition('circle_trans')
	      .duration(0)
	      .attr('r', function(d){
	           return base_bubble + ((d.voteMargin/ 100) * margin_range);
	       }).call(waitForAllTransitions,
	       	function(){
	       		sp.resolve();
	       	}
	       )

	      return sp;
	  	}

	  	function zoomAndPanMap(active){

	  		var sp = new SimplePromise();

				var bounds = path.bounds(active.datum()),
						dx = bounds[1][0] - bounds[0][0],
						dy = bounds[1][1] - bounds[0][1],
						x = (bounds[0][0] + bounds[1][0]) / 2,
						y = (bounds[0][1] + bounds[1][1]) / 2,

						// // calculating different scale for all provinces
						//scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),

						// getting the translate coordinates
						translate = [(width / 2 - scale * x), (height / 2 - scale * (y)) + y_offset_tx];

						svg.transition()
						.duration(600)
						.call(zoom.transform,
							d3.zoomIdentity
							.translate(translate[0], translate[1])
							.scale(scale)
						)
						.call(waitForAllTransitions, function(){
							sp.resolve(translate);
						})

	      return sp;
	  	}

	  	function translateAndScaleProvincialSeats(translate) {

	  		var sp = new SimplePromise();

	  		d3.selectAll(".pSeatCircle")
				.style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)");

				d3.selectAll(".pSeatCircle")
				.transition('zoom_trans')
				.duration(300)
				.style('opacity', '1')
	      .call(waitForAllTransitions,function(){
	      	sp.resolve(translate);
	      })

	      return sp;
	  	}

	  	function scaleVoronoi(translate, Prov, inactive_circles){

	      var sp = new SimplePromise();

	  		d3.selectAll(".circle-catcher.pMap")
	      .transition('zoom_trans')
	      .duration(1)
	      .style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)")
	      .style("display", d => (d.province == Prov) ? "block" : "none")
	      .call(waitForAllTransitions,function(){
	        sp.resolve(translate);
	      });

	      inactive_circles.style('opacity', 0);

	      return sp;
	  	}

	    function makeProvMap(Prov, type){

	      var selected_prov = Prov;

	      var active = d3.select("path" + "." + selected_prov).classed("active", true).classed("inactive", false).raise();
	      var inactive = d3.selectAll("path:not(" + "." + selected_prov + ")").classed("inactive", true).classed("active", false);
	      var active_circles = d3.selectAll("circle.pSeatCircle" + "." + selected_prov).classed("active", true).classed("inactive", false);
	      var inactive_circles = d3.selectAll("circle.pSeatCircle:not(" + "." + selected_prov + ")").classed("inactive", true).classed("active", false);

	 /*     active_circles.attr('r', function(){
	                 return 0;
	             }); */

	      var delay_time = 1000;
	      var trans_time = 1000;
	      var trans_bubble_time = 600;

	      active_circles.style("display", "block");
	      active_circles.style("opacity", "0");

	      removeInactiveCircles(inactive_circles)
	      .then(function(resolvedPromise){
	      		return repaintStrokes(inactive, active)
	      	}
	    	).then(function(resolvedPromise){
	    			return setActiveCircleRadius(active_circles);
	    		}
	    	).then(function(resolvedPromise){
	    		return zoomAndPanMap(active);
	    	}).then(function(translate){
	    			return translateAndScaleProvincialSeats(translate);
	    		}
	    	).then(function(translate){
	    		scaleVoronoi(translate, selected_prov, inactive_circles);
	    	}).then(function(){
	        if (type == "update"){
	          filterCirclesPr([Prov])
	        }
	      });
	    }

	    //makeProvMap("KP");

	    // event listener for province



	    $('.provinceButt').click(function() {

	      selected_prov = $(this).attr("value");
	      summval = $(this).attr("summval");
	      d3.select("#prov_title").remove();
	      makeProvMap(selected_prov, "update");

	      function updatebar() {
	        d3.select('#barsvg')
	          .remove();

	        switch(summval) {
	            case "PK":
	                return makeSummBar(PK_summary);
	                break;
	            case "PP":
	                return makeSummBar(PP_summary);
	                break;
	            case "PS":
	                return makeSummBar(PS_summary);
	                break;
	            case "PB":
	                return makeSummBar(PB_summary);
	                break;
	        }
	      }

	      updatebar();

	    })

	    /////////////////////////////////////////////////
	    ////////////// Legend for parties ///////////////
	    /////////////////////////////////////////////////

	    var parties_legend = [
	      "Pakistan Tehreek-e-Insaf",
	      "Jamiat Ulama-e-Islam (F)",
	      "Pakistan Muslim League (N)",
	      "Independent",
	      "Pakistan Muslim League",
	      "Pakistan Peoples Party Parliamentarians",
	      "Pakistan Muslim League (F)",
	      "Muttahida Qaumi Movement Pakistan",
	      "Other"
	    ];
	    // define parts abbs and colors
	    var parties_legend_abb = parties_legend.map(d => (d != "Other" ? abbreviate(d) : "Rest"))
	    var parties_colors = parties_legend.map(d => (d != "Other" ? colorScale(d) : "#03A9F4"))

	    // defining ordinal scale for the legend
	    var ordinal = d3.scaleOrdinal()
	                    .domain(parties_legend_abb)
	                    .range(parties_colors);

	    var party_legend_div = d3.select("#legendcontain")
	                        .append("div")
	                        .classed("partyLegendSVGDiv", true)


	    party_legend_div.append('p')
	                  .text('Political Party')
	                  .style('font-size', '12px')
	                  .style('text-align', 'center')
	                  .style('margin-bottom', '-10px');

	    var party_legend_svg = party_legend_div.append("svg")
	                                          .classed("partyLegendSVG", true)
	                                          .attr('width', 280)
	                                          .attr('height', 50);

	    party_legend_svg.append("g")
	      .attr("class", "legendOrdinal")
	      .attr("transform", "translate(20,20)");
	    //
	    var legendOrdinal = d3.legendColor()
	      .shapePadding(3)
	      .shapeWidth(25)
	      .shapeHeight(10)
	      .scale(ordinal)
	      .orient('horizontal');

	    party_legend_svg.select(".legendOrdinal")
	      .call(legendOrdinal);

	    var VM_legend_div = d3.select("#legendcontain")
	                        .append("div")
	                        .classed("VMLegendSVGDiv", true)

	    VM_legend_div.append('p')
	                  .text('Vote Margin')
	                  .style('font-size', '12px')
	                  .style('text-align', 'center')
	                  .style('margin-bottom', '-10px');

	    var VM_legend_svg =  VM_legend_div.append("svg")
	                                      .classed("VMLegendSVG", true)
	                                      .attr('width', 170)
	                                      .attr('height', 50);

	    var circLegDomain = [0,25,50,75,100];
	    var circLegRange = circLegDomain.map(d => getCircleSize(d) * 1.770600970553169 * 0.7);
	    var circLegDomain = circLegDomain.map(d => d + "%");

	    var circLegScale = d3.scaleOrdinal().domain(circLegDomain).range(circLegRange);

	    VM_legend_svg.append("g")
	      .attr("class", "legendSize")
	      .attr("transform", "translate(25, 20)");

	    var legendSize = d3.legendSize()
	      .scale(circLegScale )
	      .shape('circle')
	      .shapePadding(20)
	      .labelOffset(15)
	      .orient('horizontal');

	    VM_legend_svg.select(".legendSize")
	      .call(legendSize);

	    // changing the style of legend text and circles
	    d3.selectAll(".VMLegendSVG text")
	      .style('font-size', 9);

	    d3.selectAll(".VMLegendSVG circle")
	      .style('fill', 'none')
	      .style('stroke', 'black');

	    // preprocessing_data
	    function voteDataPreP(data){
	      return data.map(function(d){
	        return {
	          seat : d.district,
	          place : (d.place != null ? d.place : "unknown"),
	          "Percentage of Votes Polled to Registered Voters" : +d['Percentage of Votes Polled to Registered Voters'].replace(' %', ''),
	          "Registered Votes" : +d['Registered Votes'],
	          "Votes Polled" : +d['Votes Polled'],
	          "Valid Votes" : +d['Valid Votes'],
	          "Rejected Votes" : +d['Rejected Votes'],
	          "results" : d['results']
	          .map(function(candidate){
	            return {
	              candidate: candidate['candidate'],
	              party: candidate['party'],
	              votes: +candidate['votes']
	            }
	          }).sort(function(a,b) {
	            return b.votes - a.votes;
	          })
	        };
	      })
	    }

	    // creating an array with district centrids
	    function distCentroids(distMapData){
	      var centroids = distMapData.map(function (feature){
	        // get district
	        var district = feature.properties.districts;
	        var object = {};
	        // for every entry create object with district and centroid
	        object["district"] = district;
	        object["centroid"] = path.centroid(feature)
	        return object;
	      });

	      return centroids
	    }

	    function getCentroid(dist) {
	      return centroids.filter(function(d){
	        return (d.district == dist);
	      })[0].centroid
	    }

	  }

	  //svg_g.attr("pointer-events", "all").call(zoom);

	  function zoomed() {
	    //g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
	    //g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
	    svg_g.attr("transform", d3.event.transform); // updated for d3 v4
	  }

	  function whiteSpaceRem(text){
	    return text.split(" ").join("")
	  }
	}
}
