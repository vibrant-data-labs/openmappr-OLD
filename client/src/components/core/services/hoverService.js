/**
* Handles Graph Hover ops
*/
angular.module('common')
    .service('hoverService', ['$rootScope', '$q', 'renderGraphfactory', 'dataGraph', 'nodeRenderer', 'inputMgmtService', 'BROADCAST_MESSAGES',
        function ($rootScope, $q, renderGraphfactory, dataGraph, nodeRenderer, inputMgmtService, BROADCAST_MESSAGES) {

            "use strict";

            /*************************************
            *************** API ******************
            **************************************/
            this.hoverNodes = hoverNodes;
            this.unhover = unhover;
            this.sigBinds = sigBinds;
            //
            // If a node hovers over an aggregation, then all the nodes in the aggr will enter hover state.
            //


            /*************************************
            ********* Local Data *****************
            **************************************/
            this.hoveredNodes = [];
            var findNodeWithId;
            /*************************************
            ********* Core Functions *************
            **************************************/

            /**
             * Hover the nodes by passing data
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
                if (hoverData.ids && hoverData.ids.length) {
                    this.hoveredNodes = hoverData.ids;
                } else if (hoverData.min || hoverData.max) {
                    this.hoveredNodes = dataGraph.getNodesByAttribRange(hoverData.attr, hoverData.min, hoverData.max);
                } else
                {
                    this.hoveredNodes = hoverData.value != null ? dataGraph.getNodesByAttrib(hoverData.attr, hoverData.value, hoverData.fivePct) : [];
                }
                _hoverHelper(this.hoveredNodes, hoverData.degree, hoverData.withNeighbors);
            }

            function unhover(degree) {
                if (!this.hoveredNodes || this.hoveredNodes.length == 0) return;

                degree = degree || 0;
                this.hoveredNodes.splice(0, this.hoveredNodes.length);
                draw(this.hoveredNodes);
            }

            function _hoverHelper(ids, degree, withNeighbors) {
                degree = degree || 0;
                if (ids.length === 0) {
                    //graphHoverService.clearHovers(true);
                } else {
                    hoverByIds(ids, degree, false, withNeighbors);
                }
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
                    console.warn('[graphHoverService] hoverByIds called before dataGraph has been loaded!');
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
                function nodesInPop(nodes) {
                    var inPop = false;
                    _.each(nodes, function (n) {
                        inPop = inPop || n.inPop !== undefined;
                    });
                    return inPop;
                }

                var nodes;
                var hoverTiggeredFromGraph = _.isObject(event.data) && event.data.graphHover != null ? event.data.graphHover : true;
                if (event.data.allNodes != undefined) {
                    //clearHovers();
                    nodes = event.data.allNodes;
                } else {
                    nodes = event.data.nodes;
                }
                console.log("[hoverService] hoverHandler hovering over " + nodes.length + " nodes");
                //setHoverState(nodes, inputMap, degree);
                draw(nodes, event.data.withNeighbors);
                // if (eventEnabled) {
                //     $rootScope.$broadcast(BROADCAST_MESSAGES.overNodes, {
                //         nodes: _.values(hoveredNodes),
                //         neighbours: _.values(hoveredNodeNeighbors),
                //         graphHover: hoverTiggeredFromGraph
                //     });
                // }
            }

            function draw(nodeIds, withNeighbors) {
                var sigRender = renderGraphfactory.getRenderer();
                var contexts = sigRender.contexts;
                var d3sel = sigRender.d3Sel.hovers();
                var settings = sigRender.settings.embedObjects({
                    prefix: sigRender.options.prefix,
                    inSelMode: false, //graphSelectionService.isAnySelected(),
                    inHoverMode: true
                });

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

                    if(withNeighbors) {
                        var neighNodes = [];
                        _.forEach(graph[neighbourFn](node.id), function addTargetNode(edgeInfo, targetId){
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

                if (withNeighbors) {

                }
                // _.forEach(renderGraphfactory.sig().graph[neighbourFn](n.id), function addTargetNode(edgeInfo, targetId) {
                //     var node = graph.getNodeWithId(targetId);
                //     node.state = inputMap.nodeNeighbour;
                //     node.inHoverNeighbor = true;
                //     hoveredNodeNeighbors[targetId] = node;
                //     _.forEach(edgeInfo, function addConnEdge(edge, edgeId) {
                //         edges[edgeId] = edge;
                //     });
                // });

                contexts.hovers.canvas.width = contexts.hovers.canvas.width;    // clear canvas
                sigRender.greyout(_.keys(nodes).length > 1, 'hover');    // only grey out if there are neighbors to show
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
                    // sort nodes by size and by selection/hover state
                    // mainSel.sort(function (n1, n2) {
                    //     var order1 = selectOrder(n1), order2 = selectOrder(n2);
                    //     if (order1 == order2) {
                    //         // sort by size
                    //         return n2.idx - n1.idx;
                    //     } else {
                    //         return order1 - order2;
                    //     }
                    // });
                    // render
                    // mainSel
                    //     .each(function hnr(node) {
                    //         nodeRenderer.d3NodeHighlightRender(node, d3.select(this), settings);
                    //     });

                    // Render node labels in hover state. Remove aggregations
                    // if (renderLabel) {
                    //     // defined in hover service
                    sigma.d3.labels.hover(
                        _.reject(nodes, 'isAggregation'),
                        [],
                        sigRender.d3Sel.labels(),
                        settings
                    );
                    // }
                }
            }


            //
            // Bind to the render graph and the define the above functions
            //
            function sigBinds(sig) {
                console.log('Binding handlers');
                var renderer = sig.renderers.graph;
                renderer.bind('render', function () {
                    draw(false);
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