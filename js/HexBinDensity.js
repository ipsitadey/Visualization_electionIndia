/* global d3, topojson */

function HexBinDensity() {
  var width = 450,
  height = 450,
  color = function(d) { return d.value; },
  indShapes = null,
  updateDomain = true,
  india = null,
  polygons = [],
  country = null,
  states = null,
  hexRadius = 0,
  hexbin = 0,
  indPoints = null,
  colorScale = null,
  svg,
  sel,
  radiusScale,
  hex = null,
  dprojection = d3.geoMercator();
  dpath = d3.geoPath().projection(dprojection);

  /* Functions */
  /* ========= */

  function drawHexmap(points) {
    console.log('points', points);
    hex = svg.append('g').attr('id', 'hexes');
    var hexes = hex.selectAll('.hex').data(points.sort(function(a,b) { return a.datapoints - b.datapoints; }))
      .enter().append('path');
    hexes.attr('class', 'hex')
        .attr('transform', function(d) { return 'translate(' + d.x + ', ' + d.y + ')'; })
        .attr('d', function(d) { return hexbin.hexagon(radiusScale(Math.abs(d.count))); })
        .style('fill', function(d) { return d.datapoints === 0 ? 'none' : colorScale(d.majority); })
        .style('border-style', 'hidden')
        .style('stroke', '#aaa')
        .style('stroke-width', .01);
  } // drawHexmap()

  function getDatapoints(data) {
    return data.map(function(el) {
      var coords = dprojection([+parseFloat(el.longi), +parseFloat(el.lat)]);
      return {      
        x: coords[0],
        y: coords[1],
        datapoint: 1,
        name: el.screen_name,
        state: el.state,
        congress: el.congress,
        bjp: el.bjp,
        positive: el.positive,
        negative: el.negative,
        neutral: el.neutral
      };
    });
  } // getDatapoints()

  function rollupHexPoints(data) {
    var maxCount = 0; // for colorScale
    var maxMajority = 0;
    var minMajority = 0;
    // Loop through all hexagons
    data.forEach(function(el) {
      // Remove grid-points
      for (var i = el.length - 1; i >= 0; --i) {
        if (el[i].datapoint === 0) {
          el.splice(i, 1);
        }
      }
      // Set up variables 
      var count = 0,
          congress = 0,
          bjp = 0,
          positive = 0,
          negative =0,
          neutral = 0,
          majority = 0,
          bjpCount = 0,
          congressCount = 0;
          // markets = [];
      // Loop through all locations in the hexagon
      el.forEach(function(elt) {
          count++; // Count the number of tweet location in hexagon
          if ((elt.congress == 1 && elt.positive == 1) || elt.bjp == 1 && elt.negative == 1) {
            majority += -1;
          }
          else if ((elt.bjp == 1 && elt.positive == 1) || (elt.congress == 1 && elt.negative == 1)){
            majority += 1;
          }
          if (elt.congress == 1) {
            congressCount += 1;
          }
          else {
            bjpCount +=1;
          }
      });
      // Add summarised data to hexagon array
      el.datapoints = count;
      if (majority < 0){
       majority = -1*Math.pow(-1*majority, 0.2);
      }
      else{
        majority = Math.pow(majority, 0.2);
      }
      el.majority = majority;
      el.count = Math.pow(Math.max(bjpCount, congressCount), 1);
      // Set the maximum number of tweets of all hexagons
      console.log(bjpCount, congressCount, el.count);
      maxCount = Math.max(maxCount, el.count);
      minMajority = Math.min(minMajority, majority); // for colorScale
      maxMajority = Math.max(maxMajority, majority); // for colorScale
    });
    // Determine exponent for the colorScale interpolator
    // Create colorScale as soon as maximum number of datapoints is determined
    // console.log('Majority', minMajority, maxMajority);
    colorScale = d3.scaleLinear().domain([minMajority, minMajority*4/5, minMajority*3/5, minMajority*2/5, minMajority*1/5, 0, 
      maxMajority*1/5, maxMajority*2/5, maxMajority*3/5, maxMajority*4/5, maxMajority])
      .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#DBDB91", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]); //d3.schemeRdYlBu[11]);

    radiusScale = d3.scaleLinear().domain([0, maxCount]).range([3.5, 11]);

    console.log('colorScale', colorScale);
    return data;
  } // rollupHexPoints()

  function getHexPoints(points) {
    hexbin = d3.hexbin() // note: global
      .radius(hexRadius)
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });
    var hexPoints = hexbin(points);
    return hexPoints;
  } // getHexPoints()

  function keepPointsInPolygon(points, polygon) {
    var pointsInPolygon = [];
    points.forEach(function(el) {
      var inPolygon = d3.polygonContains(polygon, [el.x, el.y]);
      if (inPolygon) pointsInPolygon.push(el);
    });
    return pointsInPolygon;
  } // keepPointsInPolygon()

  function getPolygonPoints(data) {
    var features = data.features[0].geometry.coordinates[756][0];
    var polygonPoints = [];
    features.forEach(function(el) {
      polygonPoints.push(dprojection(el));
    });
    return polygonPoints;
  } // getPolygonPoints()

  function getPointGrid(cols) {
    var hexDistance = width / cols;
    var rows = Math.floor(height / hexDistance);
    hexRadius = hexDistance/1.5;
    return d3.range(rows * cols).map(function(el, i) {
      return {
        x: i % cols * hexDistance,
        y: Math.floor(i / cols) * hexDistance,
        datapoint: 0
      };
    });
  } // getPointGrid()

  function update(sel, data) {
    var dataPoints = getDatapoints(data);
    console.log('dataPoints', dataPoints);
    var mergedPoints = indPoints.concat(dataPoints);
    console.log('mergedPoints', mergedPoints);
    var hexPoints = getHexPoints(mergedPoints);
    var hexPointsRolledup = rollupHexPoints(hexPoints);
    console.log('hexPointsRolledup', hexPointsRolledup);
    drawHexmap(hexPointsRolledup);
  }

  function chart(selection) {
    selection.each(function (data) {
      console.log(data);
      sel = this;
      if (indShapes===null) {
        // If we don't have the geo shapes, load them
        d3.json("data/IND_adm.json", function(error, _ind) {
          if (error) throw error;
          indShapes = _ind;
          country = topojson.feature(indShapes, indShapes.objects.IND_adm0);
          states = topojson.feature(indShapes, indShapes.objects.IND_adm1, (a, b) => a !== b);
          // Select the svg element, if it exists.
          svg = d3.select(sel) //.style("background-color", "black")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

     function ramp(color, n = 11) {
        var canvas = d3.select('#densityCanvas')
        .attr('width', n)
        .attr('height', 1);
        var context = canvas.node().getContext('2d');

        canvas.style.margin = "0 -14px";
        canvas.style.width = "calc(100% + 0px)";
        canvas.style.height = "40px";
        canvas.style.imageRendering = "pixelated";
        for (let i = 0; i < n; ++i) {
          context.fillStyle = color[i]; //color(i / (n - 1));
          context.fillRect(i, 0, 1, 1);
        }
        return canvas;
      }

    legend = g => {
      const wide = 180;
      var cnvs = ramp(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#DBDB91", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]);
      console.log('cnvs', cnvs);

      g.append("image")
          .attr("width", wide)
          .attr("height", 8)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", document.getElementById('densityCanvas').toDataURL());

      g.append("text")
          .attr("class", "caption")
          .attr("y", -6)
          .attr("fill", "#000")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("Positive Sentiment");

      var scale = d3.scalePoint()
        .domain(["Congress", "Neutral", "BJP"])
        .range([0, wide]);

      d3.axisBottom(scale).tickSize(11)(g.attr("transform", "translate(220, 20)"));
    }

    svg.append("g")
      .attr("transform", "translate(250, 40)")
      .call(legend);


          var map = svg.append("g").attr('class', 'boundary');
          // Setup the scale and translate
          var b, s, t;
          dprojection.scale(1).translate([0, 0]);
          var b = dpath.bounds(states);
          var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
          var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
          dprojection.scale(s).translate(t);

          india = map.selectAll('path').data(country.features)
            .enter()
            .append('path')
            .attr('d', dpath)
            .attr("fill", "white") //"#DBE3D5")//.attr("fill", "#454545")
            .attr("stroke-linejoin", "round");

          var points = getPointGrid(80); // 140
          var polygonPoints = getPolygonPoints(country);
          indPoints = keepPointsInPolygon(points, polygonPoints);
          update(sel, data);

        });
      } 

      else {
        hex.selectAll('.hex').remove();
        // Do we already have the geo shapes? then just draw
        update(sel, data);
      }
    });
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = _;
    return chart;
  };

  chart.colorScale = function(_) {
    if (!arguments.length) return colorScale;
    colorScale = _;
    return chart;
  };

  chart.updateDomain = function(_) {
    if (!arguments.length) return updateDomain;
    updateDomain = _;
    return chart;
  };


  return chart;

}
