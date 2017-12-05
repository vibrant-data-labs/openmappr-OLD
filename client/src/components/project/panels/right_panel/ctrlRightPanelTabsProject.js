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
                },
                {
                    iconClass: 'local_library',
                    title: 'Player',
                    panel: 'player',
                    cmd: function() {
                        $scope.panelUI.openPanel('player');
                    }
                },
                {
                    iconClass: 'favorite',
                    title: 'Groups',
                    panel: 'selection',
                    cmd: function() {
                        $scope.panelUI.openPanel('selection');
                    }
                },
                {
                    iconClass: 'brush',
                    title: 'Style',
                    panel: 'style',
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
