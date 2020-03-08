angular.module('common')
    .directive('dirHistogram', ['$timeout', 'AttrInfoService', 'projFactory', 'FilterPanelService', 'BROADCAST_MESSAGES',
        function($timeout, AttrInfoService, projFactory, FilterPanelService, BROADCAST_MESSAGES) {
            'use strict';

            /*************************************
    ******** Directive description *******
    **************************************/
            var dirDefn = {
                restrict: 'AE',
                require: '?^dirAttrRenderer',
                template: '<div class="histogram" ng-mouseleave="outBar()" ng-mousemove="overBar($event)">' +
                    '<div class="tooltip-positioner" uib-tooltip="{{tooltipText}}" tooltip-append-to-body="true" tooltip-is-open="openTooltip"></div>' +
                    '</div>' +
                    '<dir-range-filter ng-if="showFilter" ng-class="{disableFilter: disableFilter}"></dir-range-filter>',
                link: postLinkFn
            };

            /*************************************
    ************ Local Data **************
    **************************************/
            window.mappr.stats = window.mappr.stats || {};
            window.mappr.stats.distr = window.mappr.stats.distr || {};

            var logPrefix = '[dirHistogram] ';
            // var _log = window.console.log.bind(window.console);
            var _log = _.noop;

            var tooltipText;

            var defaultOpts = {
                marginTop: 10,
                marginBottom: 15,
                catMarginBottom: 75,
                marginLeft: 20,
                marginRight: 10,
                barColor: '#555555',
                barColorAfterSelection: '#bdbdbd',
                strokeColor: '#000',
                textColor: '#000',
                clickColor: '#424242',
                selectionDefaultColor: '#555555',
                highlightColor: '#666',
                strokeWidth: 0.5,
                histWidth: 300,
                histHeight: 100,
                categoricalHeight: 200,
                binCount: 18,
                maxBinCount: 18,
                minBinWidth: 18,
                xTickCount: 8,
                yTickCount: 4,
                tickWidth: 2,
                minSelectionHeight: 3,
                barPadding: 1,
                datetimeLabelHeight: 45,
                yearLabelHeight: 18
            };


            /*************************************
    ******** Controller Function *********
    **************************************/


            /*************************************
    ******** Post Link Function *********
    **************************************/
            function postLinkFn(scope, element, attrs, renderCtrl) {
                var histoBars; // Ref for histo svg bars
                var mappTheme = projFactory.getProjectSettings().theme || 'light';
                var attrInfo = AttrInfoService.getNodeAttrInfoForRG().getForId(scope.attrToRender.id);
                var histElem = element[0].childNodes[0];
                var tooltip = element.find(".d3-tip");

                //for dark or node detail theme
                if(scope.isNodeFocus || mappTheme == 'dark') {
                    defaultOpts.barColor = '#555';
                    defaultOpts.strokeColor = '#ccc';
                    defaultOpts.textColor = '#ccc';
                    defaultOpts.clickColor = '#c4c4c4';
                    defaultOpts.highlightColor = '#999';
                }

                var histoData = {
                    selectedNodes: [],
                    d3Data: [],
                    isOrdinal: false,
                    isNodeFocus: scope.isNodeFocus,
                    isCompareView: renderCtrl.isCompareView(),
                    xScaleFunc: _.noop,
                    yScaleFunc: _.noop,
                    width: 0,
                    height: 0,
                    barWidth: 0,
                    binCount: 0,
                    opts: _.clone(defaultOpts),
                    intVarData: {},
                    binType : (function() {
                        if(attrInfo.isNumeric) {
                            if(attrInfo.isInteger || attrInfo.attr.attrType == 'year') {
                                if(attrInfo.nBins < defaultOpts.binCount
                          && _.every(attrInfo.bins, function(bin) {return bin.max === bin.min;})) {
                                    return 'int_unique'; // 1 value per bin
                                }
                                else {
                                    return 'int_variable'; // Multiple values per bin
                                }
                            }
                            else {
                                return 'default'; // Float values
                            }
                        }
                        else {
                            return 'categorical'; // Categorical values
                        }
                    }()),
                    xAxisType: (function() {
                        var attrType = attrInfo.attr.attrType;
                        if(attrType == 'timestamp') { return 'dateTime'; }
                        else if(attrType == 'year') { return 'year'; }
                        else { return 'default'; }
                    }()),
                    yAxisType: (function() {
                        return 'default';
                    }())
                };

                if(histoData.xAxisType == 'dateTime') {
                    histoData.opts.histHeight += histoData.opts.datetimeLabelHeight;
                    histoData.opts.marginBottom += histoData.opts.datetimeLabelHeight;
                }
                else if(histoData.xAxisType == 'year') {
                    histoData.opts.histHeight += histoData.opts.yearLabelHeight;
                    histoData.opts.marginBottom += histoData.opts.yearLabelHeight;
                }
                if(histoData.binType == 'categorical') {
                    histoData.opts.histHeight = histoData.opts.categoricalHeight;
                    histoData.opts.marginBottom = histoData.opts.catMarginBottom;
                }

                var hasInitialSelection = false; // To check if initial selection is in place before updating current selection.

                // Override dirAttrRenderer's controller's getBinCount function
                // Histogram uses dynamic number of bins which may or may not be different than attrInfo.nBins
                renderCtrl.getBinCount = function() {
                    return histoData.binCount ? histoData.binCount : 18;
                };

                scope.$on(BROADCAST_MESSAGES.fp.initialSelection.changed, function(e, payload) {
                    try {
                        if(payload.nodes.length === 0) {
                            hasInitialSelection = false;
                        }
                        else {
                            hasInitialSelection = true;
                        }
                        updateSelectionBars(histoBars, payload.nodes, attrInfo, histoData, mappTheme, payload.nodes.length === 1);
                    } catch(e) {
                        console.error(logPrefix + "highlighting new selection throws error", e.stack, e);
                    }
                });

                scope.$on(BROADCAST_MESSAGES.fp.currentSelection.changed, function(e, payload) {
                    try {
                        if(!hasInitialSelection) {
                            hasInitialSelection = true;
                            updateSelectionBars(histoBars, payload.nodes, attrInfo, histoData, mappTheme, false);
                        }
                        else {
                            if(_.isEmpty(payload.nodes)) {
                                updateSelectionBars(histoBars, payload.nodes, attrInfo, histoData, mappTheme, false);
                            }
                            updateFiltSelBars(histoBars, payload.nodes, attrInfo, histoData);
                        }
                    } catch(e) {
                        console.error(logPrefix + "highlighting selection difference throws error", e.stack, e);
                    }
                });

                // Create global distributions & selection bars
                try {
                    var initialSelection = FilterPanelService.getInitialSelection();
                    histoBars = createGlobalDistribution(histElem, tooltip, attrInfo, renderCtrl, histoData);

                    if(!_.isEmpty(initialSelection)) {
                        updateSelectionBars(histoBars, initialSelection, attrInfo, histoData, mappTheme, initialSelection.length === 1);
                        if(initialSelection.length > 1) {
                            updateFiltSelBars(histoBars, FilterPanelService.getCurrentSelection(), attrInfo, histoData);
                        }
                    }
                    else {
                        updateSelectionBars(histoBars, FilterPanelService.getCurrentSelection(), attrInfo, histoData, mappTheme, false);
                    }
                } catch(e) {
                    console.error(logPrefix + "creating global distribution throws error", e.stack, e);
                }

                scope.outBar = function() {
                    $timeout(function() {
                        scope.openTooltip = false;
                    }, 101);
                };

                scope.overBar = function(event) {
                    scope.tooltipText = tooltipText;
                    element.find('.tooltip-positioner').css({
                        top : event.offsetY - 20,
                        left : event.offsetX
                    });
                    scope.openTooltip = false;
                    $timeout(function() {
                        scope.openTooltip = true;
                    }, 100);
                };
            }



            /*************************************
    ************ Local Functions *********
    **************************************/
            // Number formatting
            var SIFormatter = d3.format("s");
            var floatFormatter = d3.format(",.2f");

            function sanitizeYPosn(y, histoHeight, opts) {
                if(histoHeight - y >= opts.minSelectionHeight) {
                    return y;
                }
                else {
                    return histoHeight - opts.minSelectionHeight;
                }
            }

            function resetAllBarsColor(elem, opts) {
                elem.style({
                    fill: opts.barColor
                });
            }

            function setColor(color) {
                var barElem = d3.select(this);
                barElem.style({
                    fill: color
                });
            }

            function setTooltipText(data, isNumeric, xAxisType, binType) {
                if(!isNumeric) {
                    tooltipText = data.label;
                }
                else {
                    if(binType == 'int_unique') {
                        tooltipText = window.mappr.utils.numericString(data[0]);
                    }
                    else if(binType == 'int_variable') {
                        tooltipText = window.mappr.utils.numericString(data.x) + ' - ' + window.mappr.utils.numericString(data.x + data.dx - 1);
                    }
                    else if(xAxisType === 'dateTime') {
                        tooltipText = formatTimestamp(data.x, 'YYYY/MM/DD') + ' - ' + formatTimestamp(data.x + data.dx, 'YYYY/MM/DD');
                    }
                    else {
                        tooltipText = window.mappr.utils.numericString(data.x) + ' - ' + window.mappr.utils.numericString(data.x + data.dx);
                    }
                }
            }

            function formatTimestamp(val, format) {
                if(!window.moment(val).isValid()) throw new Error('Invalid timestamp!');
                return window.moment.unix(val).format(format);
            }

            function suggestBinCount(attrInfo, binType, opts) {
                var binCount;
                if(binType == 'int_unique') {
                    binCount = attrInfo.nBins;
                }
                else if(binType == 'categorical') {
                    binCount = attrInfo.values.length;
                }
                else {
                    binCount = opts.binCount;
                }
                return binCount;
            }

            function getSelectionValuesMap(nodes, attrId) {
                var result = {};
                _.each(nodes, function(node) {
                    var nodeVal = node.attr[attrId];
                    if(result[nodeVal] == null) {
                        result[nodeVal] = {
                            count: 1,
                            nodeIds: [node.id]
                        };
                    }
                    else {
                        result[nodeVal].count++;
                        result[nodeVal].nodeIds.push(node.id);
                    }
                });
                return result;
            }

            function mapSelectionToBars(selectionDataMap, histoData, isNumeric) {
                var histoRangeList = [];
                var selectionValues = _.keys(selectionDataMap);

                if(isNumeric) {
                    _.each(histoData, function(barData, i) {
                        var min = barData.x;
                        var max= barData.x + barData.dx;
                        var valsInRange = _.filter(selectionValues, function(val) {
                            if(histoData.length == i + 1)
                                return val >= min && val <= max;
                            else
                                return val >= min && val < max;
                        });
                        var valsCountInRange = 0;
                        var nodeIds = [];
                        _.each(valsInRange, function(val) {
                            valsCountInRange += selectionDataMap[val].count;
                            nodeIds = nodeIds.concat(selectionDataMap[val].nodeIds);
                        });

                        histoRangeList.push({
                            min: barData.x,
                            max: barData.x + barData.dx,
                            selectionCount: valsCountInRange,
                            nodeIds: nodeIds
                        });
                    });
                }
                else {
                    _.each(histoData, function(barData) {
                        var valsInRange = _.filter(selectionValues, function(val) {
                            return val == barData.label;
                        });
                        var valsCountInRange = 0;
                        var nodeIds = [];
                        _.each(valsInRange, function(val) {
                            valsCountInRange += selectionDataMap[val].count;
                            nodeIds = nodeIds.concat(selectionDataMap[val].nodeIds);
                        });

                        histoRangeList.push({
                            min: null,
                            max: null,
                            selectionCount: valsCountInRange,
                            nodeIds: nodeIds
                        });
                    });
                }

                return histoRangeList;
            }

            function getSelectionColor(nodes, opts) {
                if(_.keys(_.indexBy(nodes, 'colorStr')).length === 1) {
                    return nodes[0].colorStr;
                }
                else {
                    return opts.selectionDefaultColor;
                }
            }

            function getDomain(attrInfo, isNumeric, binType, intVarData) {
                if(isNumeric) {
                    if(binType == 'int_variable' || binType == 'int_unique') {
                        return [intVarData.roundMinVal, intVarData.roundMaxVal];
                    }
                    else {
                        return [attrInfo.bounds.min, attrInfo.bounds.max];
                    }
                }
                else {
                    return _.map(attrInfo.values, function(val) { return val.toString(); }).reverse();
                }
            }

            function generateD3Data(attrInfo, binCount, isNumeric, x, binThresholds, binType) {
                var values = attrInfo.values;
                var valuesCount = attrInfo.valuesCount;
                if(isNumeric) {
                    if(binType == 'int_variable' || binType == 'int_unique') {
                        return d3.layout.histogram()
                            .bins(binThresholds)(values);
                    }
                    else {
                        return d3.layout.histogram()
                            .bins(binCount)(values);
                    }
                }
                else if(attrInfo.isYear) {
                    return d3.layout.histogram()
                        .bins(x.ticks(binCount))(values);
                }
                else {
                    return _.reduce(values, function(res, val) {
                        res.push({
                            y: valuesCount[val],
                            label: val
                        });
                        return res;
                    }, []);
                }
            }

            function generateXScale(attrInfo, width, isNumeric, binType, intVarData) {
                var scale ;
                if(isNumeric) {
                    scale = d3.scale.linear()
                        .domain(getDomain(attrInfo, isNumeric, binType, intVarData))
                        .range([0, width]);
                }
                else {
                    scale = d3.scale.ordinal()
                        .domain(getDomain(attrInfo, isNumeric))
                        .rangeBands([0, width]);
                }
                return scale;
            }

            function generateYScale(attrInfo, height, data) {
                var scale;
                scale = d3.scale.linear()
                    .domain([0, d3.max(data, function(d) { return d.y; })])
                    .range([height, 0]);
                return scale;
            }

            function formatNumber(val) {
                //@bimal check and resolve - if(Math.abs(val) < 1 && (val % 1 !== 0)) {
                if((val % 1 !== 0)) {
                    return floatFormatter(val);
                }
                else {
                    return SIFormatter(val);
                }
            }

            function getBarXPosn(d, i, binType, barWidth) {
                if(binType == 'int_unique') {
                    return -1 * (barWidth/2);
                }
                else {
                    return 1;
                }
            }

            function getBinThresholds(attrInfo, opts, histoData) {
                var minVal = attrInfo.bounds.min,
                    maxVal = attrInfo.bounds.max,
                    bins = attrInfo.bins,
                    roundMinVal,
                    roundMaxVal,
                    range = maxVal - minVal,
                    binThresholds = [];

                if(histoData.binType == 'int_unique') {
                    binThresholds = _.map(bins, 'max');
                    var binInterval = bins.length > 1 ? bins[1].max - bins[0].max : 1;
                    if(bins[0].count > 0) {
                        binThresholds.unshift(bins[0].max - binInterval);
                    }
                    if(_.last(bins).count > 0) {
                        binThresholds.push(_.last(bins).max + binInterval);
                    }
                    histoData.intVarData.roundMinVal = _.head(binThresholds);
                    histoData.intVarData.roundMaxVal = _.last(binThresholds);
                    binThresholds.push(_.last(binThresholds) + 1);
                    return binThresholds;
                }

                var valsPerBin = Math.ceil(range/opts.maxBinCount);

                // Round valsPerBin
                var binCount = opts.maxBinCount;
                var x = Math.pow(10, valsPerBin.toString().length - 1);
                valsPerBin = Math.ceil(valsPerBin/x) * x;
                x = Math.pow(10, valsPerBin.toString().length - 1);
                roundMinVal = Math.floor(minVal/x) * x;

                histoData.intVarData.roundMinVal = roundMinVal;

                // Build thresholds list
                binThresholds[0] = roundMinVal;
                for(var i = 1; i <= binCount; i++) {
                    binThresholds[i] = roundMinVal + i*valsPerBin;
                    if(binThresholds[i] >= maxVal) {
                        binCount = i;
                        roundMaxVal = binThresholds[i] + valsPerBin;
                        break;
                    }
                }
                binThresholds.push(roundMaxVal);

                histoData.intVarData.roundMaxVal = roundMaxVal;
                console.log(logPrefix + 'bin thresholds for int_variable: ', binThresholds);
                return binThresholds;
            }

            function createGlobalDistribution(histElem, tooltip, attrInfo, renderCtrl, histoData) {
                var isOrdinal = histoData.isOrdinal = !attrInfo.isNumeric;
                _log(logPrefix + 'Rendering attr: ', attrInfo.attr.title);
                _log(logPrefix + 'AttrInfo: ', attrInfo);

                histoData.selectedNodes = renderCtrl.getSelectedNodes();
                var binCount, binThresholds = [];
                var selectionValuesMap;
                var opts = histoData.opts;
                var binType = histoData.binType;
                _log(logPrefix +'HISTO SELECTION VALUES MAP: ', selectionValuesMap);

                // A formatter for counts.
                // var formatCount = d3.format(",.0f");
                var yAxisWidth, barWidth, width, height,
                    containerWidth = histElem.clientWidth;

                if(binType == 'int_variable' || binType == 'int_unique') {
                    binThresholds = getBinThresholds(attrInfo, opts, histoData);
                    binCount = binThresholds.length - 1;
                }
                else {
                    binCount = suggestBinCount(attrInfo, histoData.binType, opts);
                    if(binCount > opts.maxBinCount) {
                        containerWidth = binCount*opts.minBinWidth;
                        histElem.style.width = containerWidth + 'px !important';
                    }
                }
                histoData.binCount = binCount;

                width = histoData.width = containerWidth - opts.marginLeft - opts.marginRight;
                height = histoData.height = opts.histHeight - opts.marginTop - opts.marginBottom;
                barWidth = histoData.barWidth = width/binCount - 2*opts.barPadding;


                // Generate histogram data
                var x = histoData.xScaleFunc = generateXScale(attrInfo, width, !isOrdinal, binType, histoData.intVarData);
                var data = histoData.d3Data = generateD3Data(attrInfo, binCount, !isOrdinal, x, binThresholds, binType);
                _log(logPrefix + 'histo d3 data: ', data);


                var y = histoData.yScaleFunc = generateYScale(attrInfo, height, data);

                var xAxis = d3.svg.axis()
                    .scale(x);

                if(binType == 'int_variable') {
                    xAxis.tickValues(_.filter(binThresholds, function(val, i) { return i%2 === 0; }));
                }
                else if(binType == 'int_unique') {
                    xAxis.tickValues(binThresholds);
                }

                xAxis
                    .tickFormat(function(xVal) {
                        var formattedVal;
                        if(histoData.binType == 'categorical') {
                            formattedVal = xVal;
                        }
                        else {
                            switch(histoData.xAxisType) {
                            case 'year':
                                formattedVal = xVal;
                                break;
                            case 'dateTime':
                                formattedVal = formatTimestamp(xVal, 'YYYY/MM/DD');
                                break;
                            default:
                                formattedVal = formatNumber(xVal);
                            }
                        }

                        return formattedVal;
                    })
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .ticks(opts.yTickCount)
                    .tickFormat(function(yVal) {
                        return formatNumber(yVal);
                    })
                    .orient("left");

                var svg = d3.select(histElem).append("svg")
                    .attr("width", width + opts.marginLeft + opts.marginRight)
                    .attr("height", height + opts.marginTop + opts.marginBottom)
                    .append("g")
                    .attr("transform", "translate(" + opts.marginLeft + "," + opts.marginTop + ")");

                var bar = svg.selectAll()
                    .data(data)
                    .enter()
                    .append("g")
                    .attr("class", "elem-child-highlight")
                    .attr("class", "bar")
                    .attr("transform", function(d) {
                        var xVal;
                        if(binType == 'int_unique') { xVal = d.x; }
                        else if(binType == 'categorical') { xVal = d.label; }
                        else { xVal = d.x; }

                        return "translate(" + x(xVal) + "," + 0 + ")";
                    });

                // Make global bar
                bar.append("rect")
                    .attr("x", function(d, i) { return getBarXPosn(d, i, binType, barWidth); })
                    .attr("y", function(d) {
                        return y(d.y);
                    })
                    .attr("data-main-bar", "true")
                    .attr("width", barWidth)
                    .attr("height", function(d) { return height - y(d.y); });

                // Make selection bar, initially height 0
                bar.append("rect")
                    .attr("x", function(d, i) { return getBarXPosn(d, i, binType, barWidth); })
                    .attr("y", histoData.height)
                    .attr("data-selection", "true")
                    .attr("width", barWidth)
                    .attr("height", 0);

                // Make filtered selection bar, inititally height 0
                // Make selection bar, initially height 0
                bar.append("rect")
                    .attr("x", function(d, i) { return getBarXPosn(d, i, binType, barWidth); })
                    .attr("y", histoData.height)
                    .attr("data-filt-selection", "true")
                    .attr("width", barWidth)
                    .attr("height", 0);

                // Attach listeners on parent of overlapping bars i.e 'g' element
                bar.on('mouseover', onBarHover)
                    .on('mouseout', onBarUnHover)
                    .on('click', onBarClick);

                // Append xaxis
                svg.append("g")
                    .attr("class", "xaxis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                if(histoData.xAxisType == 'dateTime' || histoData.xAxisType == 'year') {
                    svg.select(".xaxis")
                        .selectAll('text')
                        .style("text-anchor", "end")
                        .style("font-weight", "300")
                        .style("font-size", "10px")
                        .attr("dx", "-.8em")
                        .attr("dy", ".15em")
                        .attr("transform", "rotate(-70)" );
                }
                else if(binType == 'categorical') {
                    svg.select(".xaxis")
                        .selectAll('text')
                        .style("text-anchor", "start")
                        .style("font-weight", "300")
                        .style("font-size", "10px")
                        .attr("dx", ".8em")
                        .attr("dy", ".15em")
                        .attr("transform", "rotate(45)" );
                }

                svg.append("g")
                    .attr("class", "yaxis")
                    .call(yAxis);

                function onBarHover(segment, i) {
                    _log(logPrefix + 'hovering over segment - ', segment);
                    var targetElem = d3.select(d3.event.target);
                    if(!yAxisWidth) {
                        yAxisWidth = svg.select('.yaxis').node().getBBox().width;
                    }
                    if((targetElem.attr('data-selection') == 'true' && targetElem.attr('height') > 0)
                || (targetElem.attr('data-filt-selection') == 'true' && targetElem.attr('height') > 0)) {
                        renderCtrl.hoverNodeIdList(histoData.selectionCountsList[i].nodeIds, window.event);
                    }
                    else {
                        if(isOrdinal) {
                            renderCtrl.hoverNodesByAttrib(attrInfo.attr.id, segment.label, window.event);
                        }
                        else {
                            renderCtrl.hoverNodesByAttribRange(attrInfo.attr.id, segment.x, _.last(segment), window.event);
                        }
                    }
                    // showTooltip.call(this, tooltip, segment, barWidth, yAxisWidth, isOrdinal, histoData.isNodeFocus, i);
                    setTooltipText(segment, !isOrdinal, histoData.xAxisType, binType);
                }

                function onBarUnHover(segment) {
                    _log(segment);
                    // hideTooltip(tooltip);
                    renderCtrl.unHoverNodes();
                }

                function onBarClick(segment, i) {
                    _log(logPrefix + 'selecting segment - ', segment);
                    var targetElem = d3.select(d3.event.target);
                    resetAllBarsColor(bar.selectAll('rect').filter(function() {
                        return d3.select(this).attr('data-selection') != 'true';
                    }), opts);
                    if((targetElem.attr('data-selection') == 'true' && targetElem.attr('height') > 0)
                        || (targetElem.attr('data-filt-selection') == 'true' && targetElem.attr('height') > 0)
                    ) {
                        renderCtrl.selectNodeIdList(histoData.selectionCountsList[i].nodeIds, window.event);
                    }
                    else {
                        setColor.call(this, opts.clickColor);
                        if(isOrdinal) {
                            renderCtrl.selectNodesByAttrib(attrInfo.attr.id, segment.label, window.event);
                        }
                        else {
                            renderCtrl.selectNodesByAttribRange(attrInfo.attr.id, segment.x, _.last(segment), window.event);
                        }
                    }

                }

                return bar;
            }

            function updateSelectionBars(bar, selectedNodes, attrInfo, histoData, mappTheme, showClusterNodes) {

                _log(logPrefix + 'rebuilding selections');
                var principalNode = null;
                var binType = histoData.binType;

                if(showClusterNodes) {
                    principalNode = selectedNodes[0];
                    selectedNodes = FilterPanelService.getNodesForSNCluster();
                }

                var opts = histoData.opts;
                var selectionValuesMap = getSelectionValuesMap(selectedNodes, attrInfo.attr.id);
                var selectionCountsList = histoData.selectionCountsList = mapSelectionToBars(selectionValuesMap, histoData.d3Data, !histoData.isOrdinal, attrInfo);
                _log(logPrefix + 'selection values map data: ', selectionValuesMap);
                _log(logPrefix + 'selection counts list: ', selectionCountsList);
                var selectionColor = getSelectionColor(selectedNodes, opts);

                bar.each(function(d, i) {
                    var barElem = d3.select(this);
                    var globalBar = barElem.selectAll('[data-main-bar="true"]');
                    var selectionBars = barElem.selectAll('[data-selection="true"]');
                    var filteredSelBars = barElem.selectAll('[data-filt-selection="true"]');

                    barElem.selectAll('[data-mask-bar="true"]').remove();
                    globalBar.attr('opacity', 1);

                    var globalBarFillColor = selectedNodes.length ? opts.barColorAfterSelection : opts.barColor;
                    globalBar.style({
                        fill: globalBarFillColor,
                        'shape-rendering': 'crispEdges'
                        // stroke: opts.strokeColor,
                        // 'stroke-width': opts.strokeWidth
                    });


                    // 2) Shrink filtered selection bars
                    filteredSelBars.attr('height', 0);

                    // 3) Update selection bars
                    var opacity = 1;
                    var valInRange = false;
                    var nodeVal;
                    if(principalNode) {
                        opacity = 0.4;
                        nodeVal = principalNode.attr[attrInfo.attr.id];
                        valInRange = _.inRange(nodeVal, selectionCountsList[i].min, selectionCountsList[i].max);

                        if(i === 0) {
                            // First bar
                            if(nodeVal >= 0 && nodeVal < selectionCountsList[i].min) {
                                valInRange = true;
                            }
                        }
                        else if(i === bar[0].length - 1) {
                            // Last bar
                            if(nodeVal > 0 && nodeVal >= selectionCountsList[i].max) {
                                valInRange = true;
                            }
                        }

                        if(valInRange) {
                            barElem.insert("rect", '[data-selection="true"]')
                                .attr("x", function() { return getBarXPosn(d, i, binType, histoData.barWidth); })
                                .attr("y", 1)
                                .attr("data-mask-bar", "true")
                                .attr("width", histoData.barWidth)
                                .attr("height", 0)
                                .attr('fill', opts.barColor);
                            // opacity = 1;
                            // globalBar.attr('opacity', 0.7);
                            globalBar.style({
                                fill: selectionColor
                            });
                        }
                    }
                    selectionBars.attr('opacity', opacity);

                    var newBarHeight;
                    var selY = sanitizeYPosn(histoData.yScaleFunc(selectionCountsList[i].selectionCount), histoData.height, opts);
                    if(selectionCountsList[i].selectionCount >= 1) {
                        newBarHeight = histoData.height - sanitizeYPosn(histoData.yScaleFunc(selectionCountsList[i].selectionCount), histoData.height, opts);

                        selectionBars
                            .attr("x", function() { return getBarXPosn(d, i, binType, histoData.barWidth); })
                            .style({
                                fill: selectionColor
                                // fill: getSelectionColor(selectedNodes, selectionCountsList[i].nodeIds)
                            });
                    }
                    else {
                        newBarHeight = 0;
                    }

                    if(principalNode && valInRange) {
                        barElem.selectAll('[data-mask-bar="true"]')
                            .attr("y", selY)
                            .attr("height", newBarHeight);
                    }

                    if(newBarHeight != selectionBars.attr('height')) {
                        selectionBars
                            .transition()
                            .duration(1000)
                            .attr("height", newBarHeight)
                            .attr("y", selY);
                    }

                });

            }

            function updateFiltSelBars(bar, selectedNodes, attrInfo, histoData) {
                _log(logPrefix + 'rebuilding selections');
                var opts = histoData.opts;
                var selectionValuesMap = getSelectionValuesMap(selectedNodes, attrInfo.attr.id);
                var filtSelectionCountsList = mapSelectionToBars(selectionValuesMap, histoData.d3Data, !histoData.isOrdinal, attrInfo);
                _log(logPrefix + 'filtered selection values map data: ', selectionValuesMap);
                _log(logPrefix + 'filtered selection counts list: ', filtSelectionCountsList);
                var selectionColor = getSelectionColor(selectedNodes, opts);

                bar.each(function(d, i) {
                    var barElem = d3.select(this);
                    var selectionBars = barElem.selectAll('[data-selection="true"]');
                    var filteredSelBars = barElem.selectAll('[data-filt-selection="true"]');

                    selectionBars.attr('opacity', 0.3);

                    var newBarHeight;
                    var filtY = sanitizeYPosn(histoData.yScaleFunc(filtSelectionCountsList[i].selectionCount), histoData.height, opts);
                    if(filtSelectionCountsList[i].selectionCount > 0) {
                        newBarHeight = histoData.height - sanitizeYPosn(histoData.yScaleFunc(filtSelectionCountsList[i].selectionCount), histoData.height, opts);
                        filteredSelBars
                            .style({
                                fill: selectionColor
                            })
                            .attr("width", histoData.barWidth);
                    }
                    else {
                        newBarHeight = 0;
                        filteredSelBars.attr("height", 0);
                    }

                    if(newBarHeight != filteredSelBars.attr('height')) {
                        filteredSelBars
                            .transition()
                            .duration(1000)
                            .attr("height", newBarHeight)
                            .attr("y", filtY);
                    }

                });

            }

            return dirDefn;
        }
    ]);
