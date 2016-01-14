/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../_references.ts"/>

module powerbi.visuals {
    /**
     * Renders a number that can be animate change in value.
     */
    export class AnimatedNumber extends AnimatedText implements IVisual {
        private options: VisualInitOptions;

        // TODO: Remove this once all visuals have implemented update.
        private dataViews: DataView[];
        private formatter: IValueFormatter;
        private element: any;
        private chartLoad: any;
        private chartUpdate: any;

        public constructor(svg?: D3.Selection, animator?: IGenericAnimator) {
            super('myFirstVisual');

            if (svg)
                this.svg = svg;
            if (animator)
                this.animator = animator;
        }

        public init(options: VisualInitOptions) {
            this.options = options;
            let element = options.element;
            this.element = element;

            if (!this.svg)
                this.svg = d3.select(element.get(0)).append('svg');

            this.currentViewport = options.viewport;
            this.hostServices = options.host;
            this.style = options.style;
            this.updateViewportDependantProperties();
            this.initChart();
        }

        private initChart(){
            var margin = {top: 10, right: 10, bottom: 10, left: 15}
            var width = this.currentViewport.width /*960*/ - margin.left - margin.right
            var height = this.currentViewport.height /*405*/ - margin.top - margin.bottom
            var padding = 3
            var xLabelHeight = 30
            var yLabelWidth = 80
            var borderWidth = 3
            var duration = 500

            var chart = //d3.select('#chart').append('svg')
                this.svg
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

            var border = chart.append('rect')
                .attr('x', yLabelWidth)
                .attr('y', xLabelHeight)
                .style('fill-opacity', 0)
                .style('stroke', '#000')
                .style('stroke-width', borderWidth)
                .style('shape-rendering', 'crispEdges');

            let update = function(data, labelsX) {

                var allValues = Array.prototype.concat.apply([], data.map(function(d) { return d.values }));
                let maxWidth = d3.max(data.map(function(d) { return d.values.length }));
                let val1 = (width - yLabelWidth) / 8;//maxWidth;
                let val2 = (height - xLabelHeight) / data.length;
                let minR = d3.min([val1, val2]);
                var maxR = minR / 2;

                var r = function(d) {
                  if (d === 0) return 0

                  let f = d3.scale.sqrt()
                      .domain([d3.min(allValues), d3.max(allValues)])
                      .rangeRound([2, maxR - padding])

                  return f(d)
                }

                var c = d3.scale.linear()
                    .domain([d3.min(allValues), d3.max(allValues)])
                    .rangeRound([255 * 0.8, 0])

                var rows = chart.selectAll('.row')
                    .data(data, function(d){ return d.label })

                rows.enter().append('g')
                    .attr('class', 'row')

                rows.exit()
                    .transition()
                    .duration(duration)
                    .style('fill-opacity', 0)
                    .remove()

                rows.transition()
                    .duration(duration)
                    .attr('transform', function(d, i){ return 'translate(' + yLabelWidth + ',' + (maxR * i * 2 + maxR + xLabelHeight) + ')' })

                var dots = rows.selectAll('circle')
                    .data(function(d){ return d.values })

                dots.enter().append('circle')
                    .attr('cy', 0)
                    .attr('r', 0)
                    .style('fill', '#ffffff')
                    .text(function(d){ return d })

                dots.exit()
                    .transition()
                    .duration(duration)
                    .attr('r', 0)
                    .remove()

                dots.transition()
                    .duration(duration)
                    .attr('r', function(d){ return r(d) })
                    .attr('cx', function(d, i){ return i * maxR * 2 + maxR })
                    .style('fill', function(d){ return 'rgb(' + c(d) + ',' + c(d) + ',' + c(d) + ')' })

                var dotLabels = rows.selectAll('.dot-label')
                    .data(function(d){ return d.values })

                var dotLabelEnter = dotLabels.enter().append('g')
                    .attr('class', 'dot-label')
                    .on('mouseover', function(d){
                        var selection = d3.select(this)
                        selection.select('rect').transition().duration(100).style('opacity', 1)
                        selection.select("text").transition().duration(100).style('opacity', 1)
                    })
                    .on('mouseout', function(d){
                        var selection = d3.select(this)
                        selection.select('rect').transition().style('opacity', 0)
                        selection.select("text").transition().style('opacity', 0)
                    })

                dotLabelEnter.append('rect')
                    .style('fill', '#000000')
                    .style('opacity', 0)

                dotLabelEnter.append('text')
                    .style('text-anchor', 'middle')
                    .style('fill', '#ffffff')
                    .style('opacity', 0)

                dotLabels.exit().remove()

                dotLabels
                    .attr('transform', function(d, i){ return 'translate(' + (i * maxR * 2) + ',' + (-maxR) + ')' })
                    .select('text')
                        .text(function(d){ return d })
                        .attr('y', maxR + 4)
                        .attr('x', maxR)

                dotLabels
                    .select('rect')
                    .attr('width', maxR * 2)
                    .attr('height', maxR * 2)

                var xLabels = chart.selectAll('.xLabel')
                    .data(labelsX)

                xLabels.enter().append('text')
                    .attr('y', xLabelHeight)
                    .attr('transform', 'translate(0,-6)')
                    .attr('class', 'xLabel')
                    .style('text-anchor', 'middle')
                    .style('fill-opacity', 0)

                xLabels.exit()
                    .transition()
                    .duration(duration)
                    .style('fill-opacity', 0)
                    .remove()

                xLabels.transition()
                    .text(function (d) { return d })
                    .duration(duration)
                    .attr('x', function(d, i){ return maxR * i * 2 + maxR + yLabelWidth })
                    .style('fill-opacity', 1)

                var yLabels = chart.selectAll('.yLabel')
                    .data(data, function(d){ return d.label })

                yLabels.enter().append('text')
                    .text(function (d) { return d.label })
                    .attr('x', yLabelWidth)
                    .attr('class', 'yLabel')
                    .style('text-anchor', 'end')
                    .style('fill-opacity', 0)

                yLabels.exit()
                    .transition()
                    .duration(duration)
                    .style('fill-opacity', 0)
                    .remove()

                yLabels.transition()
                    .duration(duration)
                    .attr('y', function(d, i){ return maxR * i * 2 + maxR + xLabelHeight })
                    .attr('transform', 'translate(-6,' + maxR / 2.5 + ')')
                    .style('fill-opacity', 1)

                var vert = chart.selectAll('.vert')
                    .data(labelsX)

                vert.enter().append('line')
                    .attr('class', 'vert')
                    .attr('y1', xLabelHeight + borderWidth / 2)
                    .attr('stroke', '#888')
                    .attr('stroke-width', 1)
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', 0)

                vert.exit()
                    .transition()
                    .duration(duration)
                    .style('stroke-opacity', 0)
                    .remove()

                vert.transition()
                    .duration(duration)
                    .attr('x1', function(d, i){ return maxR * i * 2 + yLabelWidth })
                    .attr('x2', function(d, i){ return maxR * i * 2 + yLabelWidth })
                    .attr('y2', maxR * 2 * data.length + xLabelHeight - borderWidth / 2)
                    .style('stroke-opacity', function(d, i){ return i ? 1 : 0 })

                var horiz = chart.selectAll('.horiz').
                    data(data, function(d){ return d.label })

                horiz.enter().append('line')
                    .attr('class', 'horiz')
                    .attr('x1', yLabelWidth + borderWidth / 2)
                    .attr('stroke', '#888')
                    .attr('stroke-width', 1)
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', 0)

                horiz.exit()
                    .transition()
                    .duration(duration)
                    .style('stroke-opacity', 0)
                    .remove()

                horiz.transition()
                    .duration(duration)
                    .attr('x2', maxR * 2 * labelsX.length + yLabelWidth - borderWidth / 2)
                    .attr('y1', function(d, i){ return i * maxR * 2 + xLabelHeight })
                    .attr('y2', function(d, i){ return i * maxR * 2 + xLabelHeight })
                    .style('stroke-opacity', function(d, i){ return i ? 1 : 0 })

                border.transition()
                    .duration(duration)
                    .attr('width', maxR * 2 * labelsX.length)
                    .attr('height', maxR * 2 * data.length)

            }

            this.chartUpdate = update;

            let load = function(dataCSV) {
//            let load = function(name) {
//                d3.text(name, function(dataCSV) {

                    var labelsX = null
                    var data = []

                    d3.csv.parseRows(dataCSV, function(d) {

                      if (labelsX === null) return labelsX = d.slice(1)

                      var values = d.slice(1)
                      var i = 0

                      for (; i < values.length; i++) {
                        values[i] = parseInt(values[i], 10)
                      }

                      data.push({
                        label: d[0],
                        values: values
                      })

                    })

                    update(data, labelsX)
//                })
            }

            let _localData =
            ',0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23\n' +
            'Sunday,0,0,0,0,0,0,3,445,544,818,756,477,538,493,589,611,351,650,211,5,1,0,0,0\n' +
            'Monday,0,0,0,1,0,0,144,2193,2667,5443,5444,5029,6198,4324,4849,4051,2894,2667,1471,832,510,417,64,0\n' +
            'Tuesday,3,5,3,1,0,0,230,1716,2936,3954,4516,3955,4081,3628,3928,3481,3094,2688,2068,1260,1119,622,209,14\n' +
            'Wednesday,0,0,0,9,0,0,242,2308,4310,4680,4065,4727,4615,4628,4964,4282,4748,4564,3215,1642,987,714,306,0\n' +
            'Thursday,0,0,0,3,0,0,247,1992,3912,4536,3436,4633,4083,3728,3516,2339,2915,2345,1403,826,741,375,219,1\n' +
            'Friday,0,0,0,0,0,0,132,1367,2226,2618,1883,2428,2005,1991,2190,1495,1824,1448,800,556,366,319,13,0\n' +
            'Saturday,0,0,0,6,0,0,46,411,624,684,800,332,154,72,98,448,353,532,270,4,0,0,0,0\n';

            load(_localData);
//            load('sample1.csv');
            this.chartLoad = load;
        }

        public updateViewportDependantProperties() {
            let viewport = this.currentViewport;
            this.svg.attr('width', viewport.width)
                .attr('height', viewport.height);
        }

        public update(options: VisualUpdateOptions) {
            let data = {foo: 'bar'};
            this.log(data);
            this.updateInternal(data);
        }

        public setFormatter(formatter?: IValueFormatter): void {
            this.formatter = formatter;
        }

        public onDataChanged(options: VisualDataChangedOptions): void {
            // TODO: Remove onDataChanged & onResizing once all visuals have implemented update.
            this.update({
                dataViews: options.dataViews,
                suppressAnimations: options.suppressAnimations,
                viewport: this.currentViewport
            });
        }

        public onResizing(viewport: IViewport): void {
            // TODO: Remove onDataChanged & onResizing once all visuals have implemented update.
            this.update({
                dataViews: this.dataViews,
                suppressAnimations: true,
                viewport: viewport
            });
        }

        public canResizeTo(viewport: IViewport): boolean {
            // Temporarily disabling resize restriction.
            return true;
        }

        private log(data: any){
            console.log(JSON.stringify(data));
        }

        private updateInternal(data: any){
            //alert(data);

            let fakeData = [
                [1,2,3,4,5,6],
                [7,8,9,10,11,12],
                [13,14,15,16,17,18]
            ];

            //this.loadChart(fakeData);
        }

        private loadChart(_data, scope, element) {
/*
            let screenWidth = this.currentViewport.width;
            let screenHeight = this.currentViewport.height;

            var currentWidth;

            if (screenWidth > 1025)
                currentWidth = 1025
            else if (screenWidth > 950)
                currentWidth = 950
            else if (screenWidth > 769)
                currentWidth = 769
            else
                currentWidth = 0;

            var screenSize = {};

            screenSize["1025"] = {
                viewWidth: 610,
                viewHeight: 710,
                width: screenWidth * .15,
                height: screenHeight,
                lineWidth: screenWidth * .255,
                chartDataRight: screenWidth * .1,
                margin: {
                top: 30,
                right: 0,
                bottom: 0,
                left: 0
                }
            };

            screenSize["950"] = {
                viewWidth: 450,
                viewHeight: 715,
                width: 225,
                height: 710,
                lineWidth: 350,
                chartDataRight: 140,
                margin: {
                    top: 25,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            };

            screenSize["769"] = {
                viewWidth: 610,
                viewHeight: 700,
                width: 325,
                height: 600,
                lineWidth: 520,
                chartDataRight: 185,
                margin: {
                    top: 27,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            };

            screenSize["0"] = {
                viewWidth: 600,
                viewHeight: 700,
                width: 315,
                height: 600,
                lineWidth: 500,
                chartDataRight: 160,
                margin: {
                    top: 27,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            };

            var currentScreenSize = screenSize[currentWidth];
            var viewWidth = currentScreenSize.viewWidth;
            var viewHeight = currentScreenSize.viewHeight;
            var width = currentScreenSize.width;
            var height = currentScreenSize.height;
            var lineWidth = currentScreenSize.lineWidth;
            var chartDataRight = currentScreenSize.chartDataRight;
            var margin =  currentScreenSize.margin;
            var yMultiplyer = 20;
            var yAdjustSquares = 18;
            var yAdjustText = 26;
            var yAdjustLine = 33;
            var yShift = 8;

            var dataIndex = 1;
            var sortByTotals = false;
            var type = "rect";
            var data = _data;

            //if (scope.SortType == "totals") {
                //if (scope.FilterType == "picks") {
                    data.sort(function (a, b) {
                        var result = -1;
                        if (a.total == b.total) { result = 0; }
                        //else if (scope.SortDirType == "asc" && a.total < b.total) { result = 1; }
                        //else if (scope.SortDirType == "desc" && a.total > b.total) { result = 1; }
                        return result;
                    });
                //}
            //}

            var maxPickCount = 0;
            if (dataIndex == 1) {
                for (var i = 0; i < data.length; i++) {
                    var pickCount = d3.max(data[i]['data'], function (d) { return d[dataIndex]; });
                    if (pickCount > maxPickCount)
                        maxPickCount = pickCount;
                }
            }

            var maxPointTotal = [0, 0, 0, 0, 0, 0, 0];
            if (dataIndex > 1) {
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < data[i]['data'].length; j++) {
                        if (data[i]['data'][j][dataIndex] > maxPointTotal[j]) {
                            maxPointTotal[j] = data[i]['data'][j][dataIndex];
                        }
                    }
                }
            }

            var start_round = 1,
                end_round = 7;

            var c = d3.scale.category20c();

            var xValues = d3.set([1, 2, 3, 4, 5, 6, 7]).values();

            var x = d3.scale.linear()
                .range([0, width]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(xValues)
                .orient("top");

            let formatRounds = d3.format("0");
            xAxis.tickFormat(function (d, x, y) {
                var result = formatRounds(d);
                return result;
            });

            let svg = this.svg
                .attr("width", viewWidth)
                .attr("height", viewHeight)
                .style("margin-left", margin.left + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([start_round, end_round]);
            let xScale = d3.scale.linear()
                .domain([start_round, end_round])
                .range([0, width]);

            svg.append("g")
                .attr("class", "squareChart")
                .attr("transform", "translate(" + chartDataRight + "," + 0 + ")")
                .call(xAxis).append("title").text("Sort by Round");

            svg.select("path").remove();

            for (var j = 0; j < data.length; j++) {
                let g = svg.append("g").attr("class", "squareChart");

                if (dataIndex == 1) {
                    let scale = d3.scale.linear()
                    .domain([0, maxPickCount])
                    .range([0, 9]);
                }
                else {
                    let scale = [];
                    for (var i = 0; i < maxPointTotal.length; i++) {
                        scale.push(d3.scale.linear()
                        .domain([0, maxPointTotal[i]])
                        .range([0, 9]));
                    }
                }

                let text = g.selectAll("text")
                    .data(data[j]['data'])
                    .enter()
                    .append("text")

                let rects = g.selectAll(type)
                    .data(data[j]['data'])
                    .enter()
                    .append(type);

                function rectScale(d, i) {
                    if (scale.length == 1) {
                        return scale(d[dataIndex]) * 2;
                    } else {
                        return scale[i](d[dataIndex]) * 2;
                    }
                }

                rects
                    //rectangle
                    .attr("x", function (d, i) {
                        const scaleAdjust = rectScale(d, i) / 2;
                        return xScale(d[0]) + chartDataRight - scaleAdjust;
                    })
                    .attr("y", function (d, i) {
                        const scaleAdjust = rectScale(d, i) / 2;
                        return Math.floor(j * yMultiplyer + yAdjustSquares - scaleAdjust + (Math.floor(j / yShift) * yShift));
                    })
                    .attr("width", function (d, i) { return Math.round(rectScale(d, i)); })
                    .attr("height", function (d, i) { return Math.round(rectScale(d, i)); })
                    .attr("class", data[j]['identifier'])

                text
                    .attr("y", (j * yMultiplyer + yAdjustText) + (Math.floor(j / yShift) * yShift))
                    .attr("x", function (d, i) { return xScale(d[0]) + chartDataRight - 5; })
                    .attr("class", "value " + data[j]['identifier'])
                    .attr("xml:space", "preserve")
                    .text(function (d, i) {
                        let total;
                        if (d[4] != undefined) {

                            //if (scope.FilterType == "picks") {
                                total = d[4].pickTotals;
                            //}

                        }
                        if (total)
                            return proCalc.round(d[dataIndex]).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "   =   " + proCalc.round(total).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                        else
                            return proCalc.round(d[dataIndex]).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                    })
                .style("display", "none");

                if ((j + 1) % yShift == 0 && (j + 1) < 25) {
                    var y = (j * yMultiplyer + yAdjustLine) + (Math.floor(j / yShift) * yShift);
                    g.append("path")
                     .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", ".5")
                    .attr("d", "m 0 " + y + " l " + lineWidth + " 0");
                }

                g.append("text")
                   .attr("y", j * yMultiplyer + yAdjustText + (Math.floor(j / yShift) * yShift))
                   .attr("x", 0)
                   .attr("class", data[j]['identifier'])
                   .text(data[j]['name'])
                   .on("mouseover", mouseover)
                   .on("mouseout", mouseout)
                   .append("title").text("Reveal Team Data");
            };

            this.options = options;

            d3.select(this.element.get(0)).selectAll(".tick")
//            d3.select(element[0]).selectAll(".tick")
              .filter(function (d) {
                  var result = formatRounds(d);
                  return result == scope.SortRound && scope.SortType == "round";
              })
              .append("text")
              .attr("x", 6)
              .attr("y", -11)
              .attr("font-family", "FontAwesome")
              .text(function (d) {

                  return "\uf160";
                  //return scope.SortDirType == "asc" ? "\uf160" : "\uf161"
              });

            function mouseover(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll(type).style("display", "none");
                d3.select(g).selectAll("text.value").style("display", "block");
            }

            function mouseout(p) {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll(type).style("display", "block");
                d3.select(g).selectAll("text.value").style("display", "none");
            }
            */
        }
    }
}
