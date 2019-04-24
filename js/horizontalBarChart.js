function horizontalGroupBarChart(config) {
        function setReSizeEvent(data) {
            var resizeTimer;
            var interval = 500;
            window.removeEventListener('resize', function () {
            });
            window.addEventListener('resize', function (event) {
                if (resizeTimer !== false) {
                    clearTimeout(resizeTimer);
                }
                resizeTimer = setTimeout(function () {
                    $(data.mainDiv).empty();
                    drawHorizontalGroupBarChartChart(data);
                    clearTimeout(resizeTimer);
                }, interval);
            });
        }

        drawHorizontalGroupBarChartChart(config);
        setReSizeEvent(config);
    }
    function createhorizontalGroupBarChartLegend(mainDiv, columnsInfo, colorRange) {
        var z = d3.scaleOrdinal()
            .range(colorRange);
        var mainDivName = mainDiv.substr(1, mainDiv.length);
        $(mainDiv).before("<div id='Legend_" + mainDivName + "' class='pmd-card-body' style='margin-top:0; margin-bottom:0;'></div>");
        var keys = Object.keys(columnsInfo);
        keys.forEach(function (d) {
            var cloloCode = z(d);
            $("#Legend_" + mainDivName).append("<span class='team-graph team1' style='display: inline-block; margin-right:10px;'>\
  			<span style='background:" + cloloCode + ";width: 10px;height: 10px;display: inline-block;vertical-align: middle;'>&nbsp;</span>\
  			<span style='padding-top: 0;font-family:Source Sans Pro, sans-serif;font-size: 13px;display: inline;'>" + columnsInfo[d] + " </span>\
  		</span>");
        });

    }

    function drawHorizontalGroupBarChartChart(config) {
        var data = config.data;
        var columnsInfo = config.columnsInfo;
        var xAxis = config.xAxis;
        var yAxis = config.yAxis;
        var colorRange = config.colorRange;
        var mainDiv = config.mainDiv;
        var mainDivName = mainDiv.substr(1, mainDiv.length);
        var label = config.label;
        var requireLegend = config.requireLegend;
        d3.select(mainDiv).append("svg").attr("width", $(mainDiv).width()).attr("height", $(mainDiv).height() * 0.80);
        var svg = d3.select(mainDiv + " svg"),
            margin = { top: 10, right: 20, bottom: 25, left: 60 },
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;


        var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        if (requireLegend != null && requireLegend != undefined && requireLegend != false) {
            $("#Legend_" + mainDivName).remove();
            createhorizontalGroupBarChartLegend(mainDiv, columnsInfo, colorRange);
        }


        var y0 = d3.scaleBand()
            .rangeRound([height, 0])
            .paddingInner(0.1);


        var y1 = d3.scaleBand()
            .padding(0.05);


        var x = d3.scaleLinear()
            .rangeRound([0, width]);


        var z = d3.scaleOrdinal()
            .range(colorRange);

        var keys = Object.keys(columnsInfo);
        y0.domain(data.map(function (d) {
            return d[yAxis];
        }));
        y1.domain(keys).rangeRound([0, y0.bandwidth()]);
        x.domain([0, d3.max(data, function (d) {
            return d3.max(keys, function (key) {
                return d[key];
            });
        })]).nice();
        var maxTicks = d3.max(data, function (d) {
            return d3.max(keys, function (key) {
                return d[key];
            });
        });
        var element = g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("transform", function (d) {
                return "translate(0," + y0(d[yAxis]) + ")";
            });
        var rect = element.selectAll("rect")
            .data(function (d, i) {
                // console.log('dd', d, i);
                return keys.map(function (key) {
                    return { key: key, value: d[key], index: key + "_" + i + "_" + d[yAxis] };
                });
            })
            .enter().append("rect")
            .attr("y", function (d) {
                return y1(d.key);
            })
            .attr("width", function (d) {
                return x(d.value) - 5;
            })
            .attr("height", y1.bandwidth())
            .attr("fill", function (d) {
                return z(d.key);
            });

        var txt = element.selectAll("text")
            .data(function (d, i) {
                console.log('dd', d, i);
                return keys.map(function (key) {
                    return { key: key, value: d[key], index: key + "_" + i + "_" + d[yAxis] };
                });
            })
            .enter().append("text")
            .text(function (d) {
                return x(d.value);
            })
            .attr("x",function (d) {
                return x(d.value);
            })
            .attr("y", function (d) {
                return y1(d.key) + 10;
            });

        // console.log(d.key(), d.value, y1.bandwidth())
        // var txt = element.append("text")
        //   .data(function (d, i) {
        //         console.log('d', d, 'i', i);
        //         return keys.map(function (key) {
        //             return { key: key, value: d[key], index: key + "_" + i + "_" + d[yAxis] };});})
        //   .text(d.key)
        //   .attr("x", d.value)
        //   .attr("y", y1.bandwidth());
          // .attr("x", 6 + d * 6);


        //CBT:add tooltips
        var self = {};
        self.svg = svg;
        self.cssPrefix = "horgroupBar0_";
        self.data = data;
        self.keys = keys;
        self.height = height;
        self.width = width;
        self.label = label;
        self.yAxis = yAxis;
        self.xAxis = xAxis;


        // g.append("g")
        //     .attr("class", "axis")
        //     .attr("transform", "translate(0," + height + ")")
        //     // .call(d3.axisBottom(x).ticks(maxTicks))
        //     .append("text")
        //     .attr("x", width / 4)
        //     .attr("y", margin.bottom * 0.7)
        //     .attr("dx", "0.32em")
        //     .attr("fill", "#000")
        //     .attr("font-weight", "bold")
        //     .attr("text-anchor", "start")
        //     .text(label.xAxis);

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y0).ticks(null, "s"))
            .append("text")
            .attr("x", height * 0.75 * -1)
            .attr("y", margin.left * 0.8 * -1)//y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text(label.yAxis);

    }