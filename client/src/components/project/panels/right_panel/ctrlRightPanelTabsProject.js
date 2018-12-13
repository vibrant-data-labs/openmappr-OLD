angular.module('common')
    .controller('RightPanelTabsProjectCtrl', [
        '$scope',
        '$rootScope',
        'graphSelectionService',
        'BROADCAST_MESSAGES',
        'dataGraph',
        '$uibModal',
        function($scope, $rootScope, graphSelectionService, BROADCAST_MESSAGES, dataGraph, $uibModal) {
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
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-database',
                    title: 'Edit data',
                    panel: 'style',
                    tooltipTitle: 'Edit Data',
                    cmd: function() {
                        return $scope.openNetworkDataModal();
                    }
                },

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

            function openNetworkDataModal() {

                var modalInstance = $uibModal.open({
                    templateUrl: '/partials/components/project/data_modal/networkDataModal.html',
                    controller: 'NetworkDataModalCtrl',
                    size: 'lg',
                    resolve: {
                        mapprSettings: function() {
                            return $scope.mapprSettings;
                        }
                    }
                });

                //Called when modal is closed
                modalInstance.result.then(
                    function() {
                        console.log('Closing network data modal');
                    },
                    function() {
                        console.warn("Modal dismissed at: " + new Date());
                    }
                );
            }

            $scope.openNetworkDataModal = openNetworkDataModal;


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
