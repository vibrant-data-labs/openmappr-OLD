/**
* Handles Graph Selection ops
*/
angular.module('common')
    .service('selectService', ['$rootScope', '$q', 'renderGraphfactory', 'dataGraph', 'nodeRenderer', 'inputMgmtService', 'BROADCAST_MESSAGES',
        function ($rootScope, $q, renderGraphfactory, dataGraph, nodeRenderer, inputMgmtService, BROADCAST_MESSAGES) {

            "use strict";

            /*************************************
    *************** API ******************
    **************************************/
            this.sigBinds = sigBinds;
            this.selectNodes = selectNodes;
            this.unselect = unselect;
            this.selectedNodes = [];
            this.getActiveFilterCount = getActiveFilterCount;
            this.getFilterForId = getFilterForId;
            this.getSelectedNodes = getSelectedNodes;
            this.hasAttrId = hasAttrId;
            this.init = init;
            this.filters = null;
            this.attrs = null;
            /*************************************
    ********* Local Data *****************
    **************************************/
            var findNodeWithId;
            var attrFilters;

            function getActiveFilterCount() {
                return _.filter(_.values(attrFilters), 'isEnabled').length;
            }

            /*************************************
    ********* CLASSES ********************
    **************************************/
            function FilterConfig(attrId) {
                this.attrId = attrId;
                this.isEnabled = false;
                this.selector = null;
                this.selectedVals = [];
                this.state = {}; //Remembers filter state. Upto the consumer how to use this obj.
            }
            // if given null as nodes, then select from datagraph
            // else select from nodes
            FilterConfig.prototype.filter = function (nodes) {
                var selNodes = nodes;
                if (!this.isEnabled) return selNodes;
                else {
                    // previous filters application got us empty selection
                    if (nodes && nodes.length === 0) { return []; }

                    // if nodes is null, then select from dataGraph
                    if (!nodes) {
                        this.selector.selectfromDataGraph();
                    }
                    else {
                        this.selector.selectFromNodes(nodes);
                    }
                    // selNodes = _.map(nodeIds, function(nodeId) { return nodeIdx[nodeId]; });
                    selNodes = this.selector.getNodes();
                }
                return selNodes;
            };

            /*************************************
    ********* Core Functions *************
    **************************************/
            function init() {
                attrFilters = _.indexBy(_buildFilters(dataGraph.getNodeAttrs()), 'attrId');
            }
            /**
             * Select the nodes
             * @param {Object} selectData - The select descriptor
             * @param {string} selectData.attr - The attribute
             * @param {string} selectData.value - the attribute value
             * @param {string} selectData.min - the attribute min value
             * @param {string} selectData.max - the attribute max value
             * @param {string} selectData.fivePct - fivePct
             * @param {array}  selectData.ids - nodeIds
             * @param {boolean} selectData.filters - whether apply current filters
             */
            function selectNodes(selectData) {
                if (selectData.ids && selectData.ids.length) {
                    this.selectedNodes = selectData.ids;
                } else if (selectData.min || selectData.max) {
                    this.attrs = { attr: selectData.attr, min: selectData.min, max: selectData.max };
                    this.selectedNodes = dataGraph.getNodesByAttribRange(selectData.attr, selectData.min, selectData.max);
                } else if (selectData.filters) {
                    this.filters = attrFilters;
                    var cs = this.selectedNodes = _.reduce(_.values(attrFilters), function (acc, filterCfg) {
                        return filterCfg.filter(acc);
                    }, null); // TODO: add subset

                    this.selectedNodes = _.pluck(cs, 'id');
                }
                else {
                    this.attrs = { attr: selectData.attr, value: selectData.value };
                    this.selectedNodes = selectData.value != null ? dataGraph.getNodesByAttrib(selectData.attr, selectData.value, selectData.fivePct) : [];
                }

                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.select, {
                    filtersCount: getActiveFilterCount(),
                    selectionCount: this.selectedNodes.length,
                    nodes: this.getSelectedNodes(),
                });
            }

            function unselect() {
                if (!this.selectedNodes || this.selectedNodes.length == 0) return;

                this.selectedNodes.splice(0, this.selectedNodes.length);
                this.attrs = null;
                this.filters = null;

                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.select, {
                    filtersCount: getActiveFilterCount(),
                    selectionCount: this.selectedNodes.length,
                    nodes: this.getSelectedNodes(),
                });
            }

            function getFilterForId(id) {
                return attrFilters && attrFilters[id];
            };

            function getSelectedNodes() {
                return _.map(this.selectedNodes, findNodeWithId);
            }

            function hasAttrId(attrId, value) {
                if (this.attrs && this.attrs.attr === attrId)
                    return this.attrs.value && this.attrs.value === value;
                if (this.filters && this.filters[attrId] && this.filters[attrId].isEnabled)
                    return this.filters[attrId].state.selectedVals.indexOf(value) > -1;

                return false;
            }
            //
            // Bind to the render graph and the define the above functions
            //
            function sigBinds(sig) {
                console.log('Binding handlers');
                // The function to find out which node to select for the given id. If the node is under a cluster,
                // then select the cluster
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
                    if (node && node[renderGraphfactory.getRendererPrefix() + 'size'] === null) { // no render data
                        console.warn('Node hasn\'t been rendered: %O', node);
                    }
                    return node;
                };
            }

            function _buildFilters(attrs) {
                return _.map(attrs, function (attr) { return new FilterConfig(attr.id, "DISABLE"); });
            }
        }
    ]);
