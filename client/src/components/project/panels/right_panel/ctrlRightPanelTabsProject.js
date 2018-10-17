angular.module('common')
    .controller('RightPanelTabsProjectCtrl', ['$scope', '$rootScope', 'graphSelectionService', 'BROADCAST_MESSAGES', 'dataGraph',
        function($scope, $rootScope, graphSelectionService, BROADCAST_MESSAGES, dataGraph) {
            'use strict';

            /*************************************
             ************ Local Data **************
             **************************************/
            // var logPrefix = '[ctrlRightPanelTabs: ] ';

            /*************************************
             ********* Scope Bindings *************
             **************************************/
            /**
             *  Scope data
             */

            $scope.rightPanelTabs = [
            //   {
            //     iconClass: 'fa-info-circle',
            //     title: 'Info',
            //     panel: 'summary',
            //     cmd: function() {
            //
            //     }
            // },
                {
                    iconClass: 'fa fa-fw fa-2x fa-filter',
                    title: 'Filters',
                    tooltipTitle: 'Filter data by one or more attributes',
                    panel: 'filter',
                    cmd: function() {
                        $scope.panelUI.openPanel('filter');
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-map',
                    title: 'Legend',
                    tooltipTitle: 'See color and sizing information',
                    panel: 'summary',
                    cmd: function() {
                        $scope.panelUI.openPanel('summary');
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-list-ul',
                    title: 'List',
                    showSelCount: true,
                    tooltipTitle: 'See the list view of selected nodes - or all nodes if none are selected',
                    panel: 'info',
                    cmd: function() {
                        $scope.panelUI.openPanel('info');
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-play-circle-o',
                    title: 'Player',
                    panel: 'player',
                    tooltipTitle: 'Publish shareable map and add project information',
                    cmd: function() {
                        $scope.panelUI.openPanel('player');
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-heart',
                    title: 'Groups',
                    tooltipTitle: 'Save customer selections',
                    panel: 'selection',
                    cmd: function() {
                        $scope.panelUI.openPanel('selection');
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-paint-brush',
                    title: 'Style',
                    panel: 'style',
                    tooltipTitle: 'Edit styling for nodes, links, and labels',
                    cmd: function() {
                        $scope.panelUI.openPanel('style');
                    }
                }
            ];

            /**
             * Scope methods
             */

            /*************************************
             ****** Event Listeners/Watches *******
             **************************************/

            $scope.$on(BROADCAST_MESSAGES.renderGraph.loaded, function() {
                updateSelCount();
            });

            $scope.$on(BROADCAST_MESSAGES.selectNodes, function() {
                updateSelCount();
            });

            $scope.$on(BROADCAST_MESSAGES.selectStage, function() {
                updateSelCount();
            });

            $scope.$on(BROADCAST_MESSAGES.fp.currentSelection.changed, function() {
                updateSelCount();
            });



            /*************************************
             ********* Initialise *****************
             **************************************/

            /*************************************
             ********* Core Functions *************
             **************************************/

            function updateSelCount() {
                $scope.selNodesCount = graphSelectionService.getSelectedNodes().length;
            }


        }
    ]);
