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
                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.subset.init);
            }

            function subsetSelection(nodes) {
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
                currentSubsetIndex = -1;
                this.subsetHistory = [];

                $rootScope.$broadcast(BROADCAST_MESSAGES.hss.subset.changed, {
                    subsetCount: 0,
                    nodes: dataGraph.getAllNodes(),
                });
            }

            function undo() {

            }

            function redo() {

            }
        }
    ]);
