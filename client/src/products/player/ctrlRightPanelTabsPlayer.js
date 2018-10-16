angular.module('common')
    .controller('RightPanelTabsPlayerCtrl', ['$scope', 'graphSelectionService', 'BROADCAST_MESSAGES', 'dataGraph',
        function($scope, graphSelectionService, BROADCAST_MESSAGES, dataGraph) {
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
                {
                    iconClass: 'info_outline',
                    title: 'Info',
                    tooltipTitle: 'See project information',
                    panel: 'modal',
                    // highlighted: true,
                    cmd: function() {
                        $scope.panelUI.openPanel('modal');
                    }
                },
                {
                    iconClass: 'slideshow',
                    title: 'Slides',
                    panel: 'slides',
                    tooltipTitle: 'See slide information and change views if there are more than one',
                    cmd: function() {
                        $scope.panelUI.openPanel('slides');
                    }
                },
                {
                    iconClass: 'filter_list',
                    title: 'Filters',
                    panel: 'filter',
                    tooltipTitle: 'Filter data by one or more attributes',
                    cmd: function() {
                        $scope.panelUI.openPanel('filter');
                    }
                },
                {
                    iconClass: 'map',
                    title: 'Legend',
                    panel: 'summary',
                    tooltipTitle: 'See color and sizing information',
                    cmd: function() {
                        $scope.panelUI.openPanel('summary');
                    }
                },
                {
                    iconClass: 'list',
                    title: 'List',
                    showSelCount: true,
                    tooltipTitle: 'See the list view of selected nodes - or all nodes if none are selected',
                    panel: 'info',
                    cmd: function() {
                        $scope.panelUI.openPanel('info');
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
