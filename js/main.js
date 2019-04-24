/* global d3, timeSeriesChart, USCloroplethByState, crossfilter */

var timelineChart = timeSeriesChart()
	.width(1200)
	.x(function (d) {return d.key; })
	.y(function(d) {return d.value; });

var Cloropleth = CloroplethByState();
var HexBinDensity = HexBinDensity();
var CommunityGraph = CommunityGraph();
var timeFmt = d3.timeParse("%m/%d/%Y %H:%M")
var electionData = null;

var electionData_dimTime = null;
var electionData_dimState = null;
var electionData_dimGraph = null;
var electionData_dimData = null;

var electionData_timeHours = null;
var electionData_states = null;
var electionData_weight = null;
var electionData_Data = null;


d3.csv(data_file, 
	function(d) {
		d.created_date = timeFmt(d.created_date);
		d.bjp = +d.bjp;
		d.congress = +d.congress;
		d.positive = +d.positive;
		d.negative = +d.negative;
		d.neutral = +d.neutral;
		d.weight = +d.weight;
      	try{
      	if((d.created_date.getFullYear() > 2017) && (d.sentiment.length > 1)){
      		return d;
      	}
      	}
      	catch {

      	}
	},
	function(err, data) {
	if(err) throw err;
	console.log('data', data);

	electionData = crossfilter(data);

	electionData_dimTime = electionData.dimension(function (d) { return d.created_date;});
	electionData_dimState = electionData.dimension(function(d) { return d.state});
	electionData_dimGraph = electionData.dimension(function(d) {return [d.screen_name, d.retweet_user]});
	electionData_dimData = electionData.dimension(function (d) { return d});

	electionData_timeHours = electionData_dimTime.group(d3.timeHour);
	electionData_states = electionData_dimState.group();
	electionData_weight = electionData_dimGraph.group();
	electionData_Data = electionData_dimData;

	timelineChart.onBrushed(function (selected) {
		electionData = crossfilter(data);
		electionData_dimTime = electionData.dimension(function (d) { return d.created_date;});

		electionData_dimTime.filter(selected);

		electionData_dimTime = electionData.dimension(function (d) { return d.created_date;});
		electionData_dimState = electionData.dimension(function(d) { return d.state});
		electionData_dimGraph = electionData.dimension(function(d) {return [d.screen_name, d.retweet_user]});
		electionData_dimData = electionData.dimension(function (d) { return d});

		electionData_timeHours = electionData_dimTime.group(d3.timeHour);
		electionData_states = electionData_dimState.group();
		electionData_weight = electionData_dimGraph.group();
		electionData_Data = electionData_dimData;

		update();
	});

	function update() {
		var electionData1 = [];
		electionData_weight.all()
			.forEach(function (d,i) {
				if (d.value > 0){
					d.source = d.key[1]; 
					d.target = d.key[0];
					d.weight = d.value;
					electionData1.push(d);}});

		d3.select("#Graph")
			.datum(electionData1)
			.call(CommunityGraph);

		var nested = d3.nest()
		  .key(function(d) {return d.state;})
		  .rollup(function(d) {
		    return {
		    	count: d3.sum(d, function(e) { return e.weight; }),
		        congress: d3.sum(d, function(e) { return e.congress; }),
		        bjp: d3.sum(d, function(e) { return e.bjp; }),
		        bjp_positive: d3.sum(d, function(e) { if (e.bjp==1) {return e.positive} else {return 0} }),
		        bjp_negative: d3.sum(d, function(e) { if (e.bjp==1) {return e.negative} else {return 0} }),
		        bjp_neutral: d3.sum(d, function(e) { if (e.bjp==1) {return e.neutral} else {return 0} }),
		        congress_positive: d3.sum(d, function(e) { if (e.congress==1) {return e.positive} else {return 0} }),
		        congress_negative: d3.sum(d, function(e) { if (e.congress==1) {return e.negative} else {return 0} }),
		        congress_neutral: d3.sum(d, function(e) { if (e.congress==1) {return e.neutral} else {return 0} })
		    };
		  })
		  .entries(electionData_Data.top(Number.MAX_SAFE_INTEGER));

		d3.select("#Choropleth")
			.datum(nested)
			.call(Cloropleth);

		d3.select("#HexBinDensity")
			.datum(electionData_Data.top(Number.MAX_SAFE_INTEGER))
			.call(HexBinDensity);

		ed = crossfilter(data);
		ed_dimTime = ed.dimension(function (d) { return d.created_date;});
		ed_timeHours = ed_dimTime.group(d3.timeHour);

		d3.select("#timeline")
			.datum(ed_timeHours.all())
			.call(timelineChart);
	}
	update();
});