function CommunityGraph() {

var width = 420,
    height = 420,
    svg,
    gsel = null;

function createNetwork(edgelist) {
  var sample_size = 500.0;
  var population = edgelist.length;
  var frac = sample_size/population;
  console.log('data', edgelist);
  console.log('data_length', edgelist.length, 'frac', frac);

  edgelist_sample = [];
  edgelist.forEach(function (edge) {
    if (Math.random() < frac) {
      edgelist_sample.push(edge);
    }
  });

  console.log('sample_data', edgelist_sample);

  var nodeHash = {};
  var nodes = [];
  var edges = [];

  edgelist_sample.forEach(function (edge) {
    if (edge.source != 'DUMMY') {

    if (!nodeHash[edge.source]) {
      nodeHash[edge.source] = {id: edge.source, label: edge.source};
      nodes.push(nodeHash[edge.source]);
    }
    if (!nodeHash[edge.target]) {
      nodeHash[edge.target] = {id: edge.target, label: edge.target};
      nodes.push(nodeHash[edge.target]);
    }
    // if (edge.weight == 1) {
      edges.push({id: nodeHash[edge.source].id + "-" + nodeHash[edge.target].id, source: nodeHash[edge.source], target: nodeHash[edge.target], weight: edge.weight});
    // }
  }});
  console.log('nodes', nodes, 'edges', edges);
  createForceNetwork(nodes, edges);
}


function createForceNetwork(nodes, edges) {
  //create a network from an edgelist
  var colors = d3.scaleOrdinal().domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]).range(["#996666", "#66CCCC", "#FFFF99", "#CC9999", "#666633", "#993300", "#999966", "#660000", "#996699", "#cc6633", "#ff9966", "#339999", "#6699cc", "#ffcc66", "#ff6600", "#00ccccc"]);
  var node_data = nodes.map(function (d) {return d.id});
  var edge_data = edges.map(function (d) {return {source: d.source.id, target: d.target.id, weight: 1}; });
  var community = jLouvain().nodes(node_data).edges(edge_data);
  var result  = community();

  nodes.forEach(function (node) {
    node.module = result[node.id]});

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.index }))
      .force("collide",d3.forceCollide( function(d){return d.r + 2 }).iterations(1) ) // 16
      .force("charge", d3.forceManyBody().strength(-9))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("y", d3.forceY(0))
      .force("x", d3.forceX(0));

  var link = svg.selectAll(".link")
      .data(edges)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", 5)
      .style("fill", function (d) {return colors(d.module)})
      .style("stroke", "white")
      .style("stroke-width", function (d) {return d.border ? "3px" : "1px"})
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  var labels = node.append("text")
  .attr("dy", ".35em")
  .attr("text-anchor", "middle")
  .text(function(d) { return d.id; });

  var cell = node.append("path")
      .attr("class", "cell");

    // tooltip div:
  const tooltip = d3.select(gsel).append("div")
                    .classed("tooltip", true)
                    .style("opacity", 0); // start invisible

  node.on("mouseover", function(d) {
    console.log('d', d);
    tooltip.transition()
      .duration(300)
      .style("opacity", 1) // show the tooltip
    tooltip.html(d.id)
      .style("left", d.x + "px")
      .style("top", d.y + "px")
  })
  .on("mouseleave", function(d) {
    tooltip.transition()
      .duration(200)
      .style("opacity", 0)
  })

  var ticked = function() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      labels
          .attr("x", function(d) { return d.x + 8; })
          .attr("y", function(d) { return d.y; })
  }  
  
  simulation
      .nodes(nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(edges);    
  
  
  
  function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
  }
  
  function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
  }
  
  function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
  }
}


function chart(selection) {
    selection.each(function (data) {
      console.log('usgraph', data);
      sel = this;
      if (gsel===null) {
        gsel = sel;
        svg = d3.select(sel).append("svg")
          .attr("width", width)
          .attr("height", height);
      }
      else {
        var temp = d3.select(sel);
        temp.select("svg").remove();
        svg = temp.append("svg")
          .attr("width", width)
          .attr("height", height)
      }
      createNetwork(data);
    });
  }


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


  return chart;

}
