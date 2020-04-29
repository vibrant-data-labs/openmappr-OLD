/**
* Handles Graph Hover ops
*/
angular.module('common')
    .service('hoverService', ['$rootScope', '$q', 'renderGraphfactory', 'dataGraph', 'nodeRenderer', 'inputMgmtService', 'BROADCAST_MESSAGES', 'selectService', 'subsetService', 'SelectorService',
        function ($rootScope, $q, renderGraphfactory, dataGraph, nodeRenderer, inputMgmtService, BROADCAST_MESSAGES, selectService, subsetService, SelectorService) {

            "use strict";

            /*************************************
            *************** API ******************
            **************************************/
            this.hoverNodes = hoverNodes;
            this.unhover = unhover;
            this.sigBinds = sigBinds;


            /*************************************
            ********* Local Data *****************
            **************************************/
            this.hoveredNodes = [];
            var findNodeWithId;

            // reset to selected values only
            $rootScope.$on(BROADCAST_MESSAGES.hss.select, unhover.bind(this, true));

            /*************************************
            ********* Core Functions *************
            **************************************/

            /**
             * Hover the nodes
             * @param {Object} hoverData - The hover descriptor
             * @param {string} hoverData.attr - The attribute
             * @param {string} hoverData.value - the attribute value
             * @param {string} hoverData.min - the attribute min value
             * @param {string} hoverData.max - the attribute max value
             * @param {string} hoverData.fivePct - fivePct
             * @param {string} hoverData.degree - degree
             * @param {array}  hoverData.ids - nodeIds
             * @param {boolean} hoverData.withNeighbors - whether highlight neighbors or not
             */
            function hoverNodes(hoverData) {
                this.unhover();
                var currentSubset = subsetService.currentSubset();
                var isFiltered = false;

                if (hoverData.ids && hoverData.ids.length) {
                    this.hoveredNodes = hoverData.ids;
                } else {
                    var cs = filter(hoverData, subsetService.subsetNodes)

                    this.hoveredNodes = _.pluck(cs, 'id');
                    isFiltered = true;
                }

                if (!isFiltered && currentSubset.length > 0) {
                    this.hoveredNodes = this.hoveredNodes.filter(function (x) {
                        return currentSubset.indexOf(x) > -1;
                    });
                }

                _hoverHelper(this.hoveredNodes, hoverData.degree, hoverData.withNeighbors);
            }

            function filter(data, subset) {
                var filters = selectService.copyFilters();
                if (data.min || data.max) {
                    createMinMaxFilter(filters, data.attr, data.min, data.max);
                } else {
                    createMultipleFilter(filters, data.attr, data.value);
                }

                return _.reduce(_.values(filters), function (acc, filterCfg) {
                    return filterCfg.filter(acc);
                }, subset.length > 0 ? subset : null);
            }

            function createMultipleFilter(filters, attrId, vals) {
                var filterConfig = filters[attrId];
                if (!filterConfig) return;
                var newVal = _.isArray(vals) ? vals : [vals];
                var filterVal = _.filter(_.flatten([filterConfig.state.selectedVals, _.clone(newVal)]), _.identity);
                filterConfig.state.selectedVals = filterVal;

                filterConfig.selector = SelectorService.newSelector().ofMultipleAttrValues(attrId, filterVal, true);
                filterConfig.isEnabled = filterVal && filterVal.length > 0;

                return filterConfig;
            }

            function createMinMaxFilter(filters, attrId, min, max) {
                var filterConfig = filters[attrId];
                if (!filterConfig) return;
                
                if (!filterConfig.isEnabled) {
                    filterConfig.selector = SelectorService.newSelector().ofMultiAttrRange(attrId, [{ min: min, max: max }]);
                } else {
                    var item = _.find(filterConfig.selector.attrRanges, function(r) { return r.min == min && r.max == max});
                    if (item) {
                        filterConfig.selector.attrRanges = _.filter(filterConfig.selector.attrRanges, function(r) {
                            return r.min != min || r.max != max; 
                         });
                    } else {
                        filterConfig.selector.attrRanges.push({ min: min, max: max });
                    }
                }

                filterConfig.isEnabled = filterConfig.selector.attrRanges.length > 0;
                return filterConfig;
            }

            function unhover(forceRender) {
                this.hoveredNodes.splice(0, this.hoveredNodes.length);

                this.hoveredNodes = _.clone(selectService.selectedNodes || []);
                draw(this.hoveredNodes, false, forceRender);
            }

            function _hoverHelper(ids, degree, withNeighbors) {
                degree = degree || 0;
                hoverByIds(ids, degree, false, withNeighbors);
            }

            /** 
            * Selects the given list of node Ids
            * @param  {[type]} nodeIds [nodeIds, agregations not allowed]
            * @return {[type]}         [description]
            */
            function hoverByIds(nodeIds, degree, hoveredFromGraph, withNeighbors) {
                // Make sure the ids exist in the dataGraph
                var rd = dataGraph.getRawDataUnsafe();
                if (!_.isArray(nodeIds) || !_.isObject(nodeIds))
                    nodeIds = [nodeIds];
                if (!rd) {
                    console.warn('[hoverService] hoverByIds called before dataGraph has been loaded!');
                } else {
                    _.each(nodeIds, function (n) {
                        if (!rd.hasNode(n))
                            console.warn('Node Id: %i does not exist in the node', n.id);
                    });
                    return _hoverNodes(nodeIds, degree, hoveredFromGraph, withNeighbors);
                }
            }

            // These nodes are shown on screen. Aggr allowed
            function _hoverNodes(nodes, degree, hoveredFromGraph, withNeighbors) {
                hoverHandler('overNodes', {
                    data: {
                        nodes: nodes,
                        allNodes: nodes,
                        graphHover: hoveredFromGraph != null ? hoveredFromGraph : true,
                        withNeighbors: withNeighbors
                    }
                }, inputMgmtService.inputMapping().hoverNode, degree);
            }

            // clears current hovers, and sets the event.data.nodes to hover state
            function hoverHandler(eventName, event, inputMap, degree) {
                var nodes;
                var hoverTiggeredFromGraph = _.isObject(event.data) && event.data.graphHover != null ? event.data.graphHover : true;
                if (event.data.allNodes != undefined) {
                    //clearHovers();
                    nodes = event.data.allNodes;
                } else {
                    nodes = event.data.nodes;
                }
                console.log("[hoverService] hoverHandler hovering over " + nodes.length + " nodes");

                draw(nodes, event.data.withNeighbors);
            }

            function draw(nodeIds, withNeighbors, forceRender) {
                var subsetNodes = subsetService.subsetNodes;
                var sigRender = renderGraphfactory.getRenderer();
                var contexts = sigRender.contexts;
                var d3sel = sigRender.d3Sel.hovers();
                var settings = sigRender.settings.embedObjects({
                    prefix: sigRender.options.prefix,
                    inSelMode: false,
                    inHoverMode: true
                });

                if (nodeIds.length == 0 && subsetNodes.length == 0) {
                    sigRender.greyout(false);
                }

                if (nodeIds.length == 1) {
                    withNeighbors = true;
                }

                var neighbourFn = 'getNodeNeighbours';
                var graph;
                if (withNeighbors) {
                    // Which direction to use
                    if (settings('edgeDirectionalRender') === 'all')
                        neighbourFn = 'getNodeNeighbours';
                    else if (settings('edgeDirectionalRender') === 'incoming')
                        neighbourFn = 'getInNodeNeighbours';
                    else if (settings('edgeDirectionalRender') === 'outgoing')
                        neighbourFn = 'getOutNodeNeighbours';

                    graph = renderGraphfactory.sig().graph;
                }
                var edges = {};
                var nodes = _.map(nodeIds, function (nodeId) {
                    var node = findNodeWithId(nodeId, sigRender.sig);
                    node.inHover = true;

                    if (withNeighbors) {
                        var neighNodes = [];
                        _.forEach(graph[neighbourFn](node.id), function addTargetNode(edgeInfo, targetId) {
                            node.inHoverNeighbor = true;
                            //hoveredNodeNeighbors[targetId] = node;
                            _.forEach(edgeInfo, function addConnEdge(edge, edgeId) {
                                neighNodes.push(findNodeWithId(edge.source, sigRender.sig));
                                neighNodes.push(findNodeWithId(edge.target, sigRender.sig))
                                edges[edgeId] = edge;
                            });
                        });

                        return [node].concat(neighNodes);
                    }
                    else {
                        return node;
                    }
                });
                nodes = _.flatten(nodes);

                var nodeId = window.mappr.utils.nodeId;

                contexts.hovers.canvas.width = contexts.hovers.canvas.width;    // clear canvas
                sigRender.greyout(_.keys(nodes).length > 1, subsetNodes.length > 0 ? 'select' : 'hover');    // only grey out if there are neighbors to show
                if (settings('enableHovering')) {
                    // var prefix = settings('prefix');

                    //render edges on the selections canvas
                    _.each(edges, function (o) {
                        (sigma.canvas.edges[o.type] || sigma.canvas.edges.def)(
                            o,
                            findNodeWithId(o.source, sigRender.sig),
                            findNodeWithId(o.target, sigRender.sig),
                            contexts.hovers,
                            settings,
                            sigRender.displayScale
                        );
                    });

                    // Render nodes in hover state
                    var mainSel = d3sel.selectAll('div').data(nodes, nodeId);
                    mainSel.exit().remove();
                    //create nodes if needed
                    mainSel.enter()
                        .append('div')
                        .style('position', 'absolute')
                        // .style('z-index', function(d, i) { return d.idx + 1;})
                        .each(function hnc(node) {
                            nodeRenderer.d3NodeHighlightCreate(node, d3.select(this), settings);
                            nodeRenderer.d3NodeHighlightRender(node, d3.select(this), settings);
                        });

                    //sigRender.greyout(_.keys(nodes).length > 1, 'hover');
                    sigma.d3.labels.hover(
                        _.reject(nodes, 'isAggregation'),
                        [],
                        sigRender.d3Sel.labels(),
                        settings
                    );
                }
            }


            //
            // Bind to the render graph and the define the above functions
            //
            function sigBinds(sig) {
                console.log('Binding handlers');
                var renderer = sig.renderers.graph;
                var _this = this;
                renderer.bind('render', function () {
                    _this.unhover();
                });

                // The function to find out which node to hover for the given id. If the node is under a cluster,
                // then hover the cluster
                findNodeWithId = function findNodeWithId(nodeId) {
                    var node = sig.graph.nodes(nodeId);
                    if (!node) {
                        // possibly aggregated, return the node Aggregation
                        node = sig.graph.getParentAggrNode(nodeId);
                        if (!node) {
                            console.warn('Node with Id: %s does not exist in the graph', nodeId);
                        } else {
                            //console.log('Found aggregation node:%O  for node Id:%s', node, nodeId);
                        }
                    } else {
                        //console.log('Found node:%O  for node Id:%s', node, nodeId);
                    }
                    if (node && node[renderGraphfactory.getRendererPrefix() + 'size'] == null) {
                        console.warn('Node hasn\'t been rendered: %O', node);
                    }
                    return node;
                };
            }
        }
    ]);