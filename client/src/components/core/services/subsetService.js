/**
* Handles Graph Subset ops
*/
angular.module('common')
    .service('subsetService', ['$rootScope', '$q', 'renderGraphfactory', 'dataGraph', 'nodeRenderer', 'inputMgmtService', 'BROADCAST_MESSAGES',
        function ($rootScope, $q, renderGraphfactory, dataGraph, nodeRenderer, inputMgmtService, BROADCAST_MESSAGES) {

            "use strict";

            /*************************************
    *************** API ******************
    **************************************/
            this.subset = subset;
            this.subsetSelection = subsetSelection;
            this.unsubset = unsubset;
            this.undo = undo;
            this.redo = redo;
            this.subsetHistory = [];
            this.subsetNodes = [];
            this.sigBinds = sigBinds;
            this.currentSubset = function () {
                if (currentSubsetIndex >= this.subsetHistory.length || currentSubsetIndex < 0)
                    return [];

                return this.subsetHistory[currentSubsetIndex];
            }
            /*************************************
    ********* Local Data *****************
    **************************************/
            var currentSubsetIndex = -1;

            /*************************************
    ********* Core Functions *************
    **************************************/
            function subset() {
                draw([]);
                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.subset.init);
            }

            function subsetSelection(nodes) {
                if (this.subsetNodes) {
                    _.forEach(this.subsetNodes, function (val) {
                        val.isSubsetted = false;
                    });
                }
                draw(nodes);
                var nodeIds = _.pluck(nodes, 'id');
                if (currentSubsetIndex == this.subsetHistory.length - 1) {
                    this.subsetHistory.push(nodeIds);
                } else {
                    this.subsetHistory.splice(currentSubsetIndex);
                    this.subsetHistory.push(nodeIds);
                }

                currentSubsetIndex++;

                this.subsetNodes = nodes;
                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.subset.changed, {
                    subsetCount: this.currentSubset().length,
                    nodes: nodes,
                });
            }

            function unsubset() {
                if (this.subsetNodes) {
                    _.forEach(this.subsetNodes, function (val) {
                        val.isSubsetted = false;
                    });
                }
                
                currentSubsetIndex = -1;
                this.subsetHistory = [];
                this.subsetNodes = [];
                draw([]);

                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.subset.changed, {
                    subsetCount: 0,
                    nodes: dataGraph.getAllNodes(),
                });
            }

            function undo() {

            }

            function redo() {

            }

            function draw(nodes) {
                var sigRender = renderGraphfactory.getRenderer();
                var contexts = sigRender.contexts;
                var d3sel = sigRender.d3Sel.subset();
                var settings = sigRender.settings.embedObjects({
                    prefix: sigRender.options.prefix,
                    inSelMode: false,
                    inHoverMode: false
                });

                _.forEach(nodes, function (val) {
                    val.isSubsetted = true;
                    val.inHover = false;
                    val.isSelected = false;
                });

                var nodeId = window.mappr.utils.nodeId;
                contexts.subset.canvas.width = contexts.subset.canvas.width;    // clear canvas

                var mainSel = d3sel.selectAll('div').data(nodes, nodeId);
                mainSel.exit().remove();
                mainSel.remove();
                //create nodes if needed
                d3sel.selectAll('div').data(nodes, nodeId).enter()
                    .append('div')
                    .style('position', 'absolute')
                    // .style('z-index', function(d, i) { return d.idx + 1;})
                    .each(function hnc(node) {
                        nodeRenderer.d3NodeHighlightCreate(node, d3.select(this), settings);
                        nodeRenderer.d3NodeHighlightRender(node, d3.select(this), settings);
                    });

                _.forEach(nodes, function(node) {
                    node.isSelected = false;
                });
                
                if (nodes.length > 0) {
                    sigma.d3.labels.def(
                        [],
                        nodes,
                        sigRender.d3Sel.labels(),
                        settings
                    );
                }
            }

            function sigBinds(sig) {
                console.log('Binding handlers');
                var renderer = sig.renderers.graph;
                var _this = this;
                renderer.bind('render', function () {
                    draw(_this.subsetNodes);
                });
            }
        }
    ]);
