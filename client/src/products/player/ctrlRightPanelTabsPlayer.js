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
                    panel: 'modal',
                    // highlighted: true,
                    cmd: function() {
                        $scope.panelUI.openPanel('modal');
                    }
                },
                {
                    iconClass: 'local_library',
                    title: 'Slides',
                    panel: 'slides',
                    cmd: function() {
                        $scope.panelUI.openPanel('slides');
                    }
                },
                {
                    iconClass: 'equalizer',
                    title: 'Stats',
                    panel: 'filter',
                    cmd: function() {
                        $scope.panelUI.openPanel('filter');
                    }
                },
                {
                    iconClass: 'map',
                    title: 'Legend',
                    panel: 'summary',
                    cmd: function() {
                        $scope.panelUI.openPanel('summary');
                    }
                },
                {
                    iconClass: 'near_me',
                    title: 'Selection',
                    showSelCount: true,
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
