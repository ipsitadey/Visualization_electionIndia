/* global d3, topojson */

function CloroplethByState() {
  var width = 450,
  height = 450,
  color = function(d) { return d.value; },
  indShapes = null,
  updateDomain = true,
  india = null,
  india1 = null,
  country = null,
  states = null,
  sel,
  d_map,
  population_map,
  c_population_map,
  cprojection = d3.geoMercator();
  cpath = d3.geoPath().projection(cprojection);

  var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([20, 120])
    .html("<b><p id='para'></p></b></br><div id='tipDiv'></div>");

  function update(sel, data) {
    var da_map = new Map();
    data.forEach(function(d) { da_map.set(d.key, d.value)});
    d_map = da_map;
    console.log('data1', d_map);

    c_population_map = new Map();
    var c_population_array = [];
    data.forEach(function(d){ c_population_map.set(d.key, d.value.count/population_map.get(d.key)); 
                              c_population_array.push(d.value.count/population_map.get(d.key))});

    console.log('data_map', c_population_map);

    if (updateDomain) {
      // this a threshold scale with 9 steps, so the domain needs to be 9 steps
      var data_cmap = c_population_array.sort();
      var domain = d3.extent(data_cmap);
      // var d_1 = d3.quantile(data_cmap, 0.1);
      var d_2 = d3.quantile(data_cmap, 0.2);
      var d_3 = d3.quantile(data_cmap, 0.3);
      var d_4 = d3.quantile(data_cmap, 0.4);
      var d_5 = d3.quantile(data_cmap, 0.5);
      var d_6 = d3.quantile(data_cmap, 0.6);
      var d_7 = d3.quantile(data_cmap, 0.7);
      var d_8 = d3.quantile(data_cmap, 0.8);
      // var d_9 = d3.quantile(data_cmap, 0.9);
      console.log('domain', [domain[0], d_2, d_3, d_4, d_5, d_6, d_7, d_8, domain[1]].sort());
      colorScale = d3.scaleLinear().domain([domain[0], d_2, d_3, d_4, d_5, d_6, d_7, d_8, domain[1]].sort()).range(d3.schemeGreens[9]);
    }
  

    function get_population_value(state_name) {
      var tmp = c_population_map.get(state_name);
        if (typeof tmp === 'undefined') { return "rgb(255, 255, 255)"; }
      return colorScale(tmp); }
    
    india.attr("fill", function (d) { return get_population_value(d.properties.NAME_1);}).on('mouseover', function(d) {
    tool_tip.show();
    d3.select("#para")
      .append("text")
      .text(function(e) { return "State: " + d.properties.NAME_1;});

    var data_var = d_map.get(d.properties.NAME_1);

    var groupChartData = [{ "positive": data_var.bjp_negative, "neutral": data_var.bjp_neutral, "negative": data_var.bjp_negative, "party": "BJP" }, 
    { "positive": data_var.congress_positive, "neutral": data_var.congress_neutral, "negative": data_var.congress_negative, "party": "Congress" }];
    
    var columnsInfo = { "positive": "Positive", "neutral": "Neutral", "negative": "Negative"};

    var barChartConfig = {
        mainDiv: "#tipDiv",
        colorRange: ["#80450A","#270330", "#9C0685"],
        data: groupChartData,
        columnsInfo: columnsInfo,
        xAxis: "neutral",
        yAxis: "party",
        label: {
            xAxis: "Sentiment Type/Tweet Count",
            yAxis: "Party"
        },
        requireLegend: true
    };
    var groupChart = new horizontalGroupBarChart(barChartConfig);
  })
  .on('mouseout', tool_tip.hide);;
  }

  function chart(selection) {
    selection.each(function (data) {
      sel = this;
      if (indShapes===null) {
          population_map = new Map();
          d3.csv("data/population.csv", function (err, pdata) {
            pdata.forEach(function(d){ population_map.set(d.state, parseFloat(d.population)) });
          }) ;
        console.log('data', data);
        // If we don't have the geo shapes, load them
        d3.json("data/IND_adm.json", function(error, _ind) {
          if (error) throw error;
          indShapes = _ind;
          country = topojson.feature(indShapes, indShapes.objects.IND_adm0);
          states = topojson.feature(indShapes, indShapes.objects.IND_adm1, (a, b) => a !== b);
          // Select the svg element, if it exists.
        var svg = d3.select(sel)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

    function ramp(color, n = 11) {
        var canvas = d3.select('#cpathCanvas')
        .attr('width', n)
        .attr('height', 1);
        var context = canvas.node().getContext('2d');

        canvas.style.margin = "0 -14px";
        canvas.style.width = "calc(100% + 0px)";
        canvas.style.height = "40px";
        canvas.style.imageRendering = "pixelated";
        for (let i = 0; i < n; ++i) {
          context.fillStyle = color[i];
          context.fillRect(i, 0, 1, 1);
        }
        return canvas;
      }

    legend = g => {
      const wide = 180;
      var cnvs = ramp(d3.schemeGreens[9]);
      console.log('cnvs', cnvs);

      g.append("image")
          .attr("width", wide)
          .attr("height", 8)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", document.getElementById('cpathCanvas').toDataURL());

      g.append("text")
          .attr("class", "caption")
          .attr("y", -6)
          .attr("fill", "#000")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("Participation Rate");

      var scale = d3.scalePoint()
        .domain(["lowest", "median", "highest"])
        .range([0, wide]);

      d3.axisBottom(scale).tickSize(11)(g.attr("transform", "translate(220, 20)"));
    }

    svg.append("g")
      .attr("transform", "translate(250, 40)")
      .call(legend);

          svg.call(tool_tip);

          var map = svg.append("g").attr('class', 'boundary');
          // Setup the scale and translate
          var b, s, t;
          cprojection.scale(1).translate([0, 0]);
          var b = cpath.bounds(states);
          var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
          var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
          cprojection.scale(s).translate(t);

          india = map.selectAll('path').data(states.features)
            .enter()
            .append('path')
            .attr('d', cpath)
            .attr("fill", "white")
            .attr("stroke", "#282828")
            .attr("stroke-linejoin", "round");

          update(sel, data);

        });
      } else {
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
