angular.module('proApp').controller('teamSquareChartController', ['$scope', '$rootScope', 'proCalc', function ($scope, $rootScope, proCalc) {

    $scope.CompType = "standard"; //proprietary
    $scope.FilterType = "picks"; //points
    $scope.SortType = "name"; //totals,round (1-7) as a number
    $scope.SortDirType = "asc"; //desc
    $scope.SortRound = 1;

    $scope.filter = function (type) {
        $rootScope.swhooshSound();
        $scope.FilterType = type;

    }

    $scope.sort = function (type) {
        $rootScope.swhooshSound();
        if (type == $scope.SortType)
            $scope.sortDir();

        $scope.SortType = type;
    }

    $scope.sortDir = function () {
        $scope.SortDirType = $scope.SortDirType == "asc" ? "desc" : "asc";
    }

    $scope.comp = function (type) {
        $rootScope.swhooshSound();
        $scope.CompType = type;
    }

}]).directive('d3SquareChart', function ($rootScope, proCalc) {
    function loadChart(scope, element, newValue, oldValue, screenWidth, screenHeight) {
        if (screenWidth == undefined) {
            screenWidth = window.innerWidth;
        }

        if (screenHeight == undefined) {
            screenHeight = window.innerHeight;
        }

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

        //screenSize["Default"] = {
        //    viewWidth: screenWidth * .30,
        //    viewHeight: screenHeight * .72,
        //    width: screenWidth * .15,
        //    height: screenHeight,
        //    lineWidth: screenWidth * .255,
        //    chartDataRight: screenWidth * .1
        //};

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

        if (newValue != oldValue) {
            var dataIndex = 1;
            var sortByTotals = false;
            //var type = "circle";//rect
            var type = "rect";
            var data = JSON.parse(JSON.stringify($rootScope.TeamTotals));

            if (scope.FilterType == "points") {
                if (scope.CompType == "standard") {
                    dataIndex = 3
                }
                else {
                    dataIndex = 2
                }
            }


            if (scope.SortType == "totals") {

                if (scope.FilterType == "picks") {
                    data.sort(function (a, b) {
                        var result = -1;
                        if (a.total == b.total) { result = 0; }
                        else if (scope.SortDirType == "asc" && a.total < b.total) { result = 1; }
                        else if (scope.SortDirType == "desc" && a.total > b.total) { result = 1; }
                        return result;
                    });
                }
                else {
                    if (dataIndex == 2) {
                        data.sort(function (a, b) {
                            var result = -1;
                            if (a.data[6][4].proprietaryCompTotal == b.data[6][4].proprietaryCompTotal) { result = 0; }
                            else if (scope.SortDirType == "asc" && a.data[6][4].proprietaryCompTotal < b.data[6][4].proprietaryCompTotal) { result = 1; }
                            else if (scope.SortDirType == "desc" && a.data[6][4].proprietaryCompTotal > b.data[6][4].proprietaryCompTotal) { result = 1; }
                            return result;
                        });
                    }
                    else if (dataIndex == 3) {
                        data.sort(function (a, b) {
                            var result = -1;
                            if (a.data[6][4].standardCompTotal == b.data[6][4].standardCompTotal) { result = 0; }
                            else if (scope.SortDirType == "asc" && a.data[6][4].standardCompTotal < b.data[6][4].standardCompTotal) { result = 1; }
                            else if (scope.SortDirType == "desc" && a.data[6][4].standardCompTotal > b.data[6][4].standardCompTotal) { result = 1; }
                            return result;
                        });
                    }
                }
            }
            else if (scope.SortType == "name") {
                data.sort(function (a, b) {
                    if (scope.SortDirType == "asc")
                        return a.name.toUpperCase().localeCompare(b.name.toUpperCase())
                    else
                        return b.name.toUpperCase().localeCompare(a.name.toUpperCase())
                });
            }
            else {
                if (scope.SortRound != undefined) {
                    data.sort(function (a, b) {
                        var result = -1;
                        if (a.data[scope.SortRound - 1][dataIndex] == b.data[scope.SortRound - 1][dataIndex]) {
                            result = 0;
                        }
                        else if (scope.SortDirType == "desc") {
                            if (a.data[scope.SortRound - 1][dataIndex] < b.data[scope.SortRound - 1][dataIndex])
                                result = 1;
                        }
                        else if (scope.SortDirType == "asc") {
                            if (a.data[scope.SortRound - 1][dataIndex] > b.data[scope.SortRound - 1][dataIndex])
                                result = 1;
                        }
                        return result;
                    });
                }
            }

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


            var formatRounds = d3.format("0");
            xAxis.tickFormat(function (d, x, y) {
                var result = formatRounds(d);
                return result;
            });

            element.find("svg").remove();
            var svg = d3.select(element[0]).append("svg")
                .attr("width", viewWidth)
                .attr("height", viewHeight)
                .style("margin-left", margin.left + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain([start_round, end_round]);
            var xScale = d3.scale.linear()
                .domain([start_round, end_round])
                .range([0, width]);

            svg.append("g")
                .attr("class", "squareChart")
                .attr("transform", "translate(" + chartDataRight + "," + 0 + ")")
                .call(xAxis).append("title").text("Sort by Round");

            svg.select("path").remove();

            for (var j = 0; j < data.length; j++) {
                var g = svg.append("g").attr("class", "squareChart");

                if (dataIndex == 1) {
                    var scale = d3.scale.linear()
                    .domain([0, maxPickCount])
                    .range([0, 9]);
                }
                else {
                    var scale = [];
                    for (var i = 0; i < maxPointTotal.length; i++) {
                        scale.push(d3.scale.linear()
                        .domain([0, maxPointTotal[i]])
                        .range([0, 9]));
                    }
                }


                var text = g.selectAll("text")
                    .data(data[j]['data'])
                    .enter()
                    .append("text")

            

                var rects = g.selectAll(type)
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
                        var scaleAdjust = rectScale(d, i) / 2;
                        return xScale(d[0]) + chartDataRight - scaleAdjust;
                    })
                    .attr("y", function (d, i) {
                        var scaleAdjust = rectScale(d, i) / 2;
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
                        var total;
                        if (d[4] != undefined) {

                            if (scope.FilterType == "picks") {
                                total = d[4].pickTotals;
                            }
                            else {
                                if (scope.CompType == "standard") {
                                    total = d[4].standardCompTotal;
                                }
                                else {
                                    total = d[4].proprietaryCompTotal;
                                }
                            }
                        }
                        if (total)
                            return proCalc.round(d[dataIndex]).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + "   =   " + proCalc.round(total).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                        else
                            return proCalc.round(d[dataIndex]).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                    })
                .style("display", "none");

                if ((j + 1) % yShift == 0 && (j + 1) < 25) {
                    //<path xmlns="http://www.w3.org/2000/svg" fill="none" stroke="black" stroke-width="1" d="m 0 500 l 500 0" />
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

            d3.select(element[0]).selectAll('.tick').on('click', function (val) {
                scope.SortRound = val;
                scope.sort('round');
                scope.$apply();
            });
            d3.select(element[0]).selectAll(".tick")
              .filter(function (d) {
                  var result = formatRounds(d);
                  return result == scope.SortRound && scope.SortType == "round";
              })
              .append("text")
              .attr("x", 6)
              .attr("y", -11)
              .attr("font-family", "FontAwesome")
              .text(function (d) {
                  return scope.SortDirType == "asc" ? "\uf160" : "\uf161"
              });
        }



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
    }

    return {
        restrict: 'E',
        scope: {
            picks: '=',
            filter: '=',
            sort: '=',
            comp: '=',
            sortdir: '=',
            sortround: '=',
            refresh: '='
        },
        link: function (scope, element) {
            $(window).resize(function (event) {
                var rootParent = element.parent().parent().parent().parent().parent().parent();
                if (rootParent && rootParent.css("display") && rootParent.css("display") != "none") {
                    loadChart(scope.$parent, element, 0, 1);
                }
            });

            scope.$watch('picks', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
            scope.$watch('filter', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
            scope.$watch('sort', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
            scope.$watch('comp', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
            scope.$watch('sortdir', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
            scope.$watch('refresh', function (newV, OldV) {
                loadChart(scope.$parent, element, newV, OldV);
            }, true);
        }
    }
});