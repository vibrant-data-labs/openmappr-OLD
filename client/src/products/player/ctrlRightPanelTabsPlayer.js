angular.module('common')
    .controller('RightPanelTabsPlayerCtrl', ['$rootScope', '$scope', 'graphSelectionService', 'BROADCAST_MESSAGES', 'ngIntroService', 'FilterPanelService',
        '$timeout', '$window',
        function($rootScope, $scope, graphSelectionService, BROADCAST_MESSAGES, ngIntroService, FilterPanelService, $timeout, $window) {
            'use strict';

            /*************************************
             ************ Local Data **************
             **************************************/
            // var logPrefix = '[ctrlRightPanelTabs: ] ';

            /*************************************
             ********* Scope Bindings *************
             **************************************/
            /**
             *  LOAD CHANGE ngIntroService
             */

            ngIntroService.setOptions({showProgress: true})

            ngIntroService.onBeforeChange(function (targetElement) {
                if (targetElement.id == '' && $scope.panelUI.currentPanelOpen == 'slides'){
                    var nodeID = graphSelectionService.dataGraph.getAllNodes()[0].id;
                    graphSelectionService.selectByIds(nodeID);
                    $scope.zoomInfo.zoomExtents();
                }
            });
            ngIntroService.onExit(function () {
                if ($scope.panelUI.currentPanelOpen == 'slides'){
                    graphSelectionService.clearSelectionCaches();
                    $scope.zoomInfo.zoomReset();
                }
                $window.localStorage[$scope.panelUI.currentPanelOpen] = true;
            });

            /**
             *  Scope data
             */

            $scope.rightPanelTabs = [
                {
                    iconClass: 'fa fa-fw fa-2x fa-info-circle',
                    title: 'Info',
                    tooltipTitle: 'See project information',
                    panel: 'modal',
                    // highlighted: true,
                    cmd: function() {
                        $scope.panelUI.openPanel('modal');
                        if(!$window.localStorage.modal)
                            $timeout(function () {
                                ngIntroService.setOptions(
                                    {
                                        steps:[
                                            {
                                                element: '#firstLoad',
                                                intro: 'First Load just says Welcome to Mappr + a 250 wd max introduction'
                                            }
                                        ]
                                    }
                                );
                                ngIntroService.start();
                            }, 100);
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-play-circle-o',
                    title: 'Slides',
                    panel: 'slides',
                    tooltipTitle: 'See slide information and change views if there are more than one',
                    cmd: function() {
                        $scope.panelUI.openPanel('slides');
                        if(!$window.localStorage.slides)
                            $timeout(function () {
                                ngIntroService.setOptions(
                                    {
                                        steps:[
                                            {
                                                element: '#slideNavigator',
                                                intro: 'Slide Navigator'
                                            },
                                            {
                                                element: '#slideDescription',
                                                intro: 'Slide Description'
                                            }, 
                                            {
                                                element: '#mainCanvas',
                                                intro: 'Main Canvas'
                                            },
                                            {
                                                element: '#nodeZoom',
                                                intro: 'Zoom in to node'
                                            }
                                        ]
                                    },
                                );
                                ngIntroService.start();
                            }, 100);
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-filter',
                    title: 'Filters',
                    panel: 'filter',
                    tooltipTitle: 'Filter data by one or more attributes',
                    cmd: function() {
                        $scope.panelUI.openPanel('filter');                        
                        if(!$window.localStorage.filter)
                            $timeout(function () {
                                ngIntroService.setOptions(FilterPanelService.getFilterIntroOptions());
                                ngIntroService.start();
                            }, 100);
                    }
                },
                {
                    iconClass: 'fa fa-fw fa-2x fa-map',
                    title: 'Legend',
                    panel: 'summary',
                    tooltipTitle: 'See color and sizing information',
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

            $rootScope.$on(BROADCAST_MESSAGES.fp.initialSelection.changed, function() {
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
