function createNAMap_2018(type){

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

    d3.select("#majorityVote")
      .selectAll('*')
      .remove()
  }

  // listing the winning parties
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
    "Balochistan National Party",
    "MUTTHIDA MAJLIS-E-AMAL PAKISTAN",
    "Balochistan National Party (Awami)"
  ];

  // defining colors mapping to parties / other color is mapped to multiple parties
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
    other_color,
    other_color,
    other_color
  ];

  // defining categorical color scale
  var colorScale = d3.scaleOrdinal()
                     .domain(parties)
                     .range(party_colors);

  if (type == "init"){
    removeAllDisplay();
  }

  // call draw for both init and update
  function drawNAMap(){

    ////////////////////////////////////
    ////////////// Set up //////////////
    ////////////////////////////////////

    // selecting the div with id vizcontain
    var map_block = d3.select("#vizcontain")

    // projections
    // defining the projection for map (change center and scale to get desired size for the map)
    var projection = d3.geoMercator()
        // .center([68.38, 31.5])
        // .scale([150 * 14]);
        .center([75, 31.5])
        .scale([150 * 13]);

    // defining the paths for the maps
    var path = d3.geoPath().projection(projection);

    // appending svg for init
    if (type == "init"){
      // defining the svg view port for the map within the div
      var svg = map_block.append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                //.attr("viewBox", "0 0 1000 600")
                .attr("viewBox", "0 0 636 600")
                .style("fill-opacity", 1)
                .classed("map_in_a_box", "true")
                .attr("id", "NAmap")

      // appending a group in the svg with a class map_group
      var svg_g = svg.append("g")
                .classed("map_group", "true");

      var status_message = svg.append("text")
                          .attr("id", "status_message")
                          .attr('x', '50%')
                          .attr('y', 10)
                          .style('text-anchor', 'middle')
                          .style('fill', '#D32F2F')
                          .style('font-size', '12px')
                          .text('Updating data, vote information and layout')
                          // reading in alll the files and defining the execution function


    }

    // ajax calls for both init and update
    d3.queue()
      .defer(d3.json, "./essentials/pakistan_districts.topojson")
      .defer(d3.json, "./essentials/JAndKashmir.topojson")
      .defer(d3.json, "./essentials/Pak_prov.topojson")
      .defer(d3.json, "./essentials/Pakistan_NationalBoundary.topojson")
      .defer(d3.csv, "./essentials/NA_seats_2018.csv")
      .await(drawElectMap)

    ///// Get the centroids csv and turn it into an object /////

    // d3.csv('essentials/NA_2018_centroids.csv', function(na_2018_cent){
    //   console.log(na_2018_cent);
    //   var cent_object = {};
    //   na_2018_cent.forEach(function(d){
    //     cent_object[d.seat] = [+d.X, +d.Y];
    //   })
    //   console.log(JSON.stringify(cent_object));
    // })

    // defining colors mapping to parties / other color is mapped to multiple parties




    ////////////////////////////////////////////////
    ////////////// Execution function //////////////
    ////////////////////////////////////////////////

    // execution function (Draws map and gets bubbles positioned on map)
    function drawElectMap(error, topology, k_topology, pak_prov_topology, pak_topology, na_seats_2018){

      d3.selectAll("#PA, #dwvs, #flow")
        .attr('disabled', true)

      // draw map just for init
      if (type == "init"){
        // relevant data extracted from topojson files
        var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
        var kshmr_path_data = topojson.feature(k_topology, k_topology.objects.JAndKashmir).features;
        var nat_prov_data = topojson.feature(pak_prov_topology, pak_prov_topology.objects.Pak_prov).features;
        var nat_path_data = topojson.feature(pak_topology, pak_topology.objects.Pakistan_NationalBoundary).features;

        // getting district Centroids using the distCentroids function
        var centroids = distCentroids(path_data);

        ///////////////////////////////////////////////////////
        ////////////// Generating paths for maps //////////////
        ///////////////////////////////////////////////////////

        // map components for districts
        // will remian put for all map based visuals
        svg_g.selectAll("path")
              .data(path_data)
              .enter().append("path")
              .attr("d", function (d, i){ return path(d)})
              .style("stroke", "#FFF")
              .style("stroke-width", 0.25)
              .style("fill", "#FFF")
              .style("fill-opacity", 0.9)
              // each district path is classed by a district name
              .attr("class", function(d, i){
                return d.properties.districts;
              })
              .classed("district", true);

        // generating path for J and Kashmir (class Kashmir)
        svg_g.selectAll(".Kashmir")
              .data(kshmr_path_data)
              .enter().append("path")
              .classed("Kashmir", true)
              .attr("d", function (d, i){ return path(d)})
              .style("fill-opacity", 1)
              .style("stroke", "grey")
              .style("stroke-dasharray", 2)
              .style("stroke-width", 0.5)
              .style("fill", "#FFF")


        // generating path for Pakistan national boundary (class Pakistan)
        svg_g.selectAll(".Pak_boundary")
              .data(nat_path_data)
              .enter().append("path")
              .classed("Pakistan", true)
              .attr("d", function (d, i){ return path(d)})
              .style("stroke", "grey")
              .style("stroke-width", 1)
              .style("fill", "white")
              .style("fill-opacity", 0.9);

        // generating path for Pakistan provinces (class PakProv)
        svg_g.selectAll(".Pak_prov")
              .data(nat_prov_data)
              .enter().append("path")
              .classed("PakProv", true)
              .attr("d", function (d, i){ return path(d)})
              .style("stroke", "grey")
              .style("stroke-width", 0.0)
              .style("fill", "white")
              .style("fill-opacity", 0.9);
      }

      // vars defined for both init and update
      const base_bubble = 3 // min size that all bubbles take
      const margin_range = 5 // range for vote margin

      //////////////////////////////////////////////////
      ////////////// Data Pre-processing  //////////////
      //////////////////////////////////////////////////


      // comprehensive results by joining the scraped data with basic info of na_seats
      var result = join(na_seats_2018, elections_2018, "Seat", "seat", function(election_row, seat_row) {
        return {
            seat: seat_row['Seat'],
            PrimaryDistrict: seat_row.PrimaryDistrict,
            //SeconDistrict: seat_row.SeconDistrict,
            Province: seat_row.Province,
            "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
            "Registered Votes": election_row['Registered Votes'],
            "Rejected Votes": election_row['Rejected Votes'],
            "Valid Votes": election_row['Valid Votes'],
            "Votes Polled": election_row['Votes Polled'],
            results: election_row['results']
        }
      });



      // if update join updated data
      if (type == "update"){
        // comprehensive results by joining the scraped data with basic info of na_seats
        var result_upd = join(na_seats_2018, elections_2018_upd, "Seat", "seat", function(election_row, seat_row) {
          return {
              seat: seat_row['Seat'],
              PrimaryDistrict: seat_row.PrimaryDistrict,
              //SeconDistrict: seat_row.SeconDistrict,
              Province: seat_row.Province,
              "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
              "Registered Votes": election_row['Registered Votes'],
              "Rejected Votes": election_row['Rejected Votes'],
              "Valid Votes": election_row['Valid Votes'],
              "Votes Polled": election_row['Votes Polled'],
              results: election_row['results']
          }
        });


        // adding vote margin and radius and init radius to results
        // result_upd.forEach(function(d){
        //   //d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
        //   if (d.results.length == 0){
        //     d.radius = 5
        //     d.radiusInit = 5
        //   }
        //   else {
        //     d.results = d.results.sort(function(a,b) {
        //                   return b.votes - a.votes;
        //                 })
        //     d['Valid Votes'] = d.results[0].votes + d.results[1].votes;
        //     d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
        //     d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
        //     d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);
        //   }
        // })

        //console.log(result_upd);

        // loop for updated seats

        var upd_seats_list = result_upd.map(d => d.seat);
        var new_data = d3.selectAll('.naSeatCircle').data();
        upd_seats_list.forEach(function(d){
          new_data.filter(f => f.seat == d)[0].results = result_upd.filter(f => f.seat == d)[0].results
        })

        // preprocessing for selected seats
        new_data.forEach(function(d){
          //d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
          if (d.results.length == 0){
            d.radius = 5
            d.radiusInit = 5
          }
          else {
            d.results = d.results.sort(function(a,b) {
                          return b.votes - a.votes;
                        })
            d['Valid Votes'] = d.results[0].votes + d.results[1].votes;
            d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
            d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
            d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);

            console.log(d);
            var appendTimeInfoTo = d3.select('.timeupdates')
                                     .append('div')
                                     .classed('timeupdateparent', true)


              appendTimeInfoTo.append('div')
                .classed('updatecircle', true)
                .classed('animated', true)
                .classed('zoomIn', true)
                .append('svg')
                .attr('height' , '12.5')
                .attr('width', '12.5')
                .append('circle')
                .attr('cx', '6.25')
                .attr('cy', '6.25')
                .attr('r', '4')
                .attr('fill', 'grey')

              appendTimeInfoTo.append('div')
                .classed('updatetext', true)
                .classed('animated', true)
                .classed('fadeInDefault', true)
                .style('margin-bottom', '5px')
                .append('span')
                .html(function(){
                  return '<span> ' + tConvert(new Date().toLocaleTimeString()) + '. ' + d.seat + ' updated, ' + d.results[0].candidate + ', ' + abbreviate(d.results[0].party) + ' is leading against ' + d.results[1].candidate + ', ' + abbreviate(d.results[1].party) + ' by ' + (d.results[0].votes - d.results[1].votes) + ' votes</span>'
                })


          }
        })

        // update the data in update phase
        d3.selectAll('.naSeatCircle')
          .data(new_data, d => d.seat)

        d3.selectAll('.circle-catcher')
          .data(new_data, d => d.seat)

        // make bubble transitions in update phase
        d3.selectAll('.naSeatCircle')
          .transition('update_trans')
          .duration(1700)
          .ease(d3.easeElastic)
          .attr('r', function(d){
            //return d.radius;
            return 5;
          })
          .style("fill", function(d){
            if (d.results.length == 0){
              return '#BDBDBD';
            }
            else {
              return colorScale(d.results[0].party);
              //return "black";
            }
          })

        //console.log(d3.selectAll('.naSeatCircle').data())

      }


        // adding vote margin and radius and init radius to results
        result.forEach(function(d){
          //d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
          if (d.results.length == 0){
            d.radius = 5
            d.radiusInit = 5
          }
          else {
            d['Valid Votes'] = d.results[0].votes + d.results[1].votes;
            d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
            d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
            d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);
          }

          // d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
          // d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);
          //var vote_turnOut_txt = 'Percentage of Votes Polled to Registered Voters';
          //d[vote_turnOut_txt] = (d[vote_turnOut_txt] != 0) ? d[vote_turnOut_txt] : round2Dec((d["Valid Votes"]/ d["Registered Votes"]) * 100, 2);
          //d[vote_turnOut_txt] = (d[vote_turnOut_txt] != 0) ? d.approxVoteTO = false : d.approxVoteTO = true;
        })

        // adding initial x and y positions of seats/ nodes (start of the force simulation)
        result.forEach(function(d){
          d.x = projection(cent_object_2018[d.seat])[0];
          d.y = projection(cent_object_2018[d.seat])[1];
        });

        // assigning results to nodes
        var nodes = result;

        if (type == "update"){
          nodes = d3.select('.naSeatCircle').data();
        }




      /////////////////////////////////////////////////////////
      ////////////// Setting up force simulation //////////////
      /////////////////////////////////////////////////////////

      // force with charge, forceX, forceY and collision detection

      var simulation = d3.forceSimulation(nodes)
                        .force('charge', d3.forceManyBody().strength(0.7))
                        .force('x', d3.forceX().x(function(d) {
                          return projection(cent_object_2018[d.seat])[0];
                        }))
                        .force('y', d3.forceY().y(function(d) {
                          return projection(cent_object_2018[d.seat])[1];
                        }))
                        .force('collision', d3.forceCollide().radius(function(d) {
                          return d.radius + 0.80;
                        }))
                        .on('tick', ticked)
                        .alpha(0.525)
                        .alphaDecay(0.07)
                        .on('end', function() {

                          redrawVoronoi();
                          d3.select('svg').selectAll(".circle-catcher")
                            .style('display', 'block')
                          // give an 'all set message at force end and transition it out'
                          d3.select('#status_message')
                            .text('All set')
                            .style('fill', '#1976D2')
                            .transition('status_trans')
                            .delay(2500)
                            .duration(1500)
                            .style('fill-opacity', 0);

                          d3.selectAll("#PA, #dwvs, #flow")
                            .attr('disabled', null)
                            setTimeout(function(){ $("#filterdropdown").show().addClass('animated fadeInDefault').css('display', 'flex');; }, 1000);
                            setTimeout(function(){ $("#partyFilters").show().addClass('animated fadeInDefault').css('display', 'flex'); }, 1500);

                          $.ajax({url: "http://192.168.10.16:3000/api/results", success: function(result){
                            if (type == "init") {
                              console.log(result);
                              createNAMap_2018("update");
                              liveResults(createNAMap_2018);
                            }
                          }});
                        })

      //////////////////////////////////////////////////////////////
      ////////////// Adding bubble nodes for na seats //////////////
      //////////////////////////////////////////////////////////////

      if (type == "init"){
        // a group containing all na seat circles
        var u = svg.append('g')
                    .classed('na-seats-group', true)
                    .selectAll('.naSeat') // .selectAll('circle')
                    .data(nodes)

        // entering all nodes // bubbles
        // initializing position of nodes
        u.enter()
          .append('g')
          .attr('class', d => d.seat)
          .classed('naSeat_g', true)
          .append('circle')
          .attr("class", "naSeatCircle")
          .classed('2013', true)
          .classed('namap', true)
          .merge(u)
          .attr('cx', function(d) {
            return d.x;
          })
          .attr('cy', function(d) {
            return d.y;
          })
          .style("fill", function(d){
            if (d.results.length == 0){
              return '#BDBDBD';
            }
            else {
              return colorScale(d.results[0].party);
            }
          })
          // .attr("party", function(d){
          //   return d.results[0].party;
          // })
          .attr("id", function(d){
            return d.seat;
          })
          .attr('r', 0)
          .transition('bubble_up')
          .duration(1000)
          .ease(d3.easePoly)
          .attr('r', function(d){
            return d.radius;
          })
          // removing the exit selection
          u.exit().remove()
      }



        ///////////////////////////////////////////////////////////////////
        ////////////// Adding voronoi for better interaction //////////////
        ///////////////////////////////////////////////////////////////////

        var voronoi = d3.voronoi()
                        .x(d => d.x + randRange(-1, 1)) // with some noise on x and y centers
                        .y(d => d.y + randRange(-1, 1))
                        .extent([[0, 0], [width, height]]);


        if (type == "init"){
          var polygon =  svg.append("defs")
                            .selectAll(".clip.NAmap")
                            .data(voronoi.polygons(nodes))
                            //First append a clipPath element
                            .enter().append("clipPath")
                            .attr("class", "clip NAmap")
                            //Make sure each clipPath will have a unique id (connected to the circle element)
                            .attr("id", d => (d != null) ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA")
                            //Then append a path element that will define the shape of the clipPath
                            .append("path")
                            .attr("class", "clip-path-circle NAmap")
                            .call(redrawPolygon)

          //Append larger circles (that are clipped by clipPaths)
          svg.append('g').classed('clip-circles', true)
              .classed("NAmap", true)
              .selectAll(".circle-catcher")
              .data(nodes)
              .enter().append("circle")
              .attr("class", function(d,i) { return "circle-catcher NAmap " + d.seat; })
              //Apply the clipPath element by referencing the one with the same countryCode
              .attr("clip-path", function(d, i) { return "url(#clipNAmap" + d.seat + ")"; })
              //Bottom line for safari, which doesn't accept attr for clip-path
              .style("clip-path", function(d, i) { return "url(#clipNAmap" + d.seat + ")"; })
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              //Make the radius a lot bigger
              .attr('r', 20)
              .style("fill", "grey")
              .style("fill-opacity", 0.5)
              .style("pointer-events", "all")
              .style('display', 'none')
        }




        d3.selectAll('circle.circle-catcher.NAmap')
            .on("mouseover", activateMouseOv)
            .on("mouseout", activateMouseOut)
            //Notice that we now have the mousover events on these circles
            // .on("mouseover", activateHover(100))
            // .on("mouseout",  deactivateHover(100));


        function redrawPolygon(polygon) {
          polygon = d3.selectAll(".clip-path-circle");
          polygon.attr("d", function(d) { return d ? "M" + d.join(",") + "Z" : null; })
        }

        function redrawVoronoi() {
          polygon = d3.selectAll(".clip-path-circle");
          polygon = polygon.data(voronoi.polygons(nodes)).call(redrawPolygon);
        }

      function ticked() {
            // updating the circle positions
            d3.selectAll(".naSeatCircle")
              .attr('cx', function(d) {
                return d.x
              })
              .attr('cy', function(d) {
                return d.y
              })

            // redraw the voronoi clippaths

          //polygon = polygon.data(voronoi.polygons(nodes)).call(redrawPolygon);

            // changing the positions of the voronoi circle
            d3.select('svg').selectAll(".circle-catcher.NAmap").data(nodes)
              .attr('cx', d => d.x)
              .attr('cy', d => d.y)

        }

      /*  if (simulation.alpha() > 0) {
          d3.timer(ticked);
        } */

        /////////////////////////////////////////////////////
        ////////////// Adding mouse over event //////////////
        /////////////////////////////////////////////////////

        function activateMouseOv(d, i){
            // extract unique class of the hovered voronoi cell (replace "circle-catcher " to get seat)
            var unique_class = d3.select(this).attr('class').replace("circle-catcher NAmap ", "");
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
              	var i = d3.interpolate(d.radius, 10);
              	return function(t) {
                  d.radius = i(t);
                  that.attr('r', d => (d.radius >= 0) ? d.radius : 0 );
                  //simulation.nodes(nodes)
                }
            	})
              .attr('fill', function(d){
                if (d.results[0] === undefined) {
                  return '#bdbdbd'
                }
                else {
                  return d3.rgb(colorScale(d.results[0].party)).darker();
                }
              })
              .attr('stroke', function(d){
                if (d.results[0] === undefined) {
                  return d3.rgb('#bdbdbd').darker();
                }
                else {
                  return d3.rgb(colorScale(d.results[0].party)).darker();
                }
              })
              .attr('stroke-width', 2);

            // extract the datum attached to the hovered circle
            var datum = circle_select.data()[0];

            d3.select('body').append('div')
              .classed('animated', true)
              .classed('zoomIn', true)
              .classed('tool', true)
              .attr('id', 'hoverbox')
            // tooltip selection
            var tooltip = d3.select('.tool');


            if(datum.results[0] === undefined) {
              tooltip.append('div')
              .classed('toolhead', true)
              .html(function(d){
                return '<span class="NA">Data not Available</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
              })

              tooltip.append('div')
              .classed('partyicon', true)
              .html(function() {
                return '<img style="width: 100%;" src="./resources/ballot3.svg"></img>';
              });

              tooltip.append('div')
              .classed('toolhead', true)
              .html(function(d){
                return '<span class="dist">Updates will be available soon</span>'
              })
            }
              // find out the party color by color scale

              // append tooltip

            else {

              var color = colorScale(datum.results[0].party);

              tooltip.append('div')
              .classed('toolhead', true)
              .html(function(d){
                return '<span class="NA">' + datum.seat + ' </span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
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
            }

            // create the tooltip for na-map
            //createTooltip(tooltip, datum);

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

            // d3.selectAll('.voronoi').raise();
        }


        /////////////////////////////////////////////////////
        ////////////// Adding mouse out event ///////////////
        /////////////////////////////////////////////////////


        function activateMouseOut(d, i){
          // retrieve unique class of voronoi circle catcher
          var unique_class = d3.select(this).attr('class').replace("circle-catcher NAmap ", "");
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
              if (d.results[0] === undefined) {
                return '#bdbdbd';
              }
              else {
                return colorScale(d.results[0].party);
              }
            })
            .attr('stroke', function(d){
              if (d.results[0] === undefined) {
                return '#bdbdbd';
              }
              else {
                d3.rgb(colorScale(d.results[0].party));
              }
            })
            .attr('stroke-width', 0);

          // remove the tooltip
          d3.selectAll('.tool').remove()
        }


        function getCentroid(dist) {
          return centroids.filter(function(d){
            return (d.district == dist);
          })[0].centroid
        }

        // displaying the election data with results

        // na_seats_2013.map(function(d){
        //   d["SeconDistrict"] = (d["SeconDistrict"] == "" ? [] : d["SeconDistrict"].split(" - "));
        // })

        // var parties = result.map(function(d){
        //   return d.results[0].party
        // })

        // get unique values, see how to use this
        var unique_parties = parties.filter(function(item, i, ar){ return ar.indexOf(item) === i; });

        /////////////////////////////////////////////////
        ////////////// Legend for parties ///////////////
        /////////////////////////////////////////////////

        // var parties_legend = [
        //   "Pakistan Tehreek-e-Insaf",
        //   "Jamiat Ulama-e-Islam (F)",
        //   "Pakistan Muslim League (N)",
        //   "Independent",
        //   "Pakistan Muslim League",
        //   "Pakistan Peoples Party Parliamentarians",
        //   "Pakistan Muslim League (F)",
        //   "Muttahida Qaumi Movement Pakistan",
        //   "Other"
        // ];
        // // define parts abbs and colors
        // var parties_legend_abb = parties_legend.map(d => (d != "Other" ? abbreviate(d) : "Other"))
        // var parties_colors = parties_legend.map(d => (d != "Other" ? colorScale(d) : "#03A9F4"))
        //
        // // defining ordinal scale for the legend
        // var ordinal = d3.scaleOrdinal()
        //                 .domain(parties_legend_abb)
        //                 .range(parties_colors);
        //
        // var party_legend_div = d3.select("#legendcontain")
        //                     .append("div")
        //                     .classed("partyLegendSVGDiv", true)
        //
        //
        // party_legend_div.append('p')
        //               .text('Political Party')
        //               .style('font-size', '12px')
        //               .style('text-align', 'center')
        //               .style('margin-bottom', '-10px');
        //
        // var party_legend_svg = party_legend_div.append("svg")
        //                                       .classed("partyLegendSVG", true)
        //                                       .attr('width', 280)
        //                                       .attr('height', 50);
        //
        // party_legend_svg.append("g")
        //   .attr("class", "legendOrdinal")
        //   .attr("transform", "translate(20,20)");
        // //
        // var legendOrdinal = d3.legendColor()
        //   .shapePadding(3)
        //   .shapeWidth(25)
        //   .shapeHeight(10)
        //   .scale(ordinal)
        //   .orient('horizontal');
        //
        // party_legend_svg.select(".legendOrdinal")
        //   .call(legendOrdinal);
        //
        // var VM_legend_div = d3.select("#legendcontain")
        //                     .append("div")
        //                     .classed("VMLegendSVGDiv", true)
        //
        // VM_legend_div.append('p')
        //               .text('Vote Margin')
        //               .style('font-size', '12px')
        //               .style('text-align', 'center')
        //               .style('margin-bottom', '-10px');
        //
        // var VM_legend_svg =  VM_legend_div.append("svg")
        //                                   .classed("VMLegendSVG", true)
        //                                   .attr('width', 170)
        //                                   .attr('height', 50);
        //
        // var circLegDomain = [0,25,50,75,100];
        // var circLegRange = circLegDomain.map(d => getCircleSize(d));
        // var circLegDomain = circLegDomain.map(d => d + "%");
        //
        // var circLegScale = d3.scaleOrdinal().domain(circLegDomain).range(circLegRange);
        //
        //
        // VM_legend_svg.append("g")
        //   .attr("class", "legendSize")
        //   .attr("transform", "translate(25, 20)");
        //
        // var legendSize = d3.legendSize()
        //   .scale(circLegScale )
        //   .shape('circle')
        //   .shapePadding(20)
        //   .labelOffset(15)
        //   .orient('horizontal');
        //
        // VM_legend_svg.select(".legendSize")
        //   .call(legendSize);
        //
        // // changing the style of legend text and circles
        // d3.selectAll(".VMLegendSVG text")
        //   .style('font-size', 9);
        //
        // d3.selectAll(".VMLegendSVG circle")
        //   .style('fill', 'none')
        //   .style('stroke', 'black');
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

    // keep the preprocessing code in comments

    // preprocessing elections 2013 data:
    // var election_13 = elections_2013.map(function(d){
    //   return {
    //     seat : d.district,
    //     "Percentage of Votes Polled to Registered Voters" : +d['Percentage of Votes Polled to Registered Voters'].replace(' %', ''),
    //     "Registered Votes" : +d['Registered Votes'],
    //     "Votes Polled" : +d['Votes Polled'],
    //     "Valid Votes" : +d['Valid Votes'],
    //     "Rejected Votes" : +d['Rejected Votes'],
    //     "results" : d['results']
    //     .map(function(candidate){
    //       return {
    //         candidate: candidate['candidate'],
    //         party: candidate['party'],
    //         votes: +candidate['votes']
    //       }
    //     }).sort(function(a,b) {
    //       return b.votes - a.votes;
    //     })
    //   };
    //

    d3.select('#barsvg')
      .remove()

    //makeSummBar(NA_summary);
  }


  // call the draw na map function
  drawNAMap();

};