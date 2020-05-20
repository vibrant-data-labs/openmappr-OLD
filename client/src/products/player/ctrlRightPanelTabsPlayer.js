angular.module('common')
    .controller('RightPanelTabsPlayerCtrl', ['$rootScope', '$scope', '$http', 'graphSelectionService', 'BROADCAST_MESSAGES', 'ngIntroService', 'FilterPanelService',
        '$timeout', '$window', 'selectService', 'subsetService',
        function ($rootScope, $scope, $http, graphSelectionService, BROADCAST_MESSAGES, ngIntroService, FilterPanelService, $timeout, $window, selectService, subsetService) {
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

            ngIntroService.setOptions({ showProgress: true })

            ngIntroService.onBeforeChange(function (targetElement) {
                if (targetElement.id == '' && $scope.panelUI.currentPanelOpen == 'slides') {
                    var nodeID = graphSelectionService.dataGraph.getAllNodes()[0].id;
                    selectService.selectSingleNode(nodeID);
                    $scope.zoomInfo.zoomExtents();
                }
            });
            ngIntroService.onExit(function () {
                if ($scope.panelUI.currentPanelOpen == 'slides') {
                    selectService.unselect();
                    $scope.zoomInfo.zoomReset();
                }
                $window.localStorage[$scope.panelUI.currentPanelOpen] = true;
            });

            /**
             *  Scope data
             */

            $scope.currentExport = 'all';
            $scope.expandedState = {
                isSet: false,
                isExpanded: false
            };
            $scope.togglePanel = function () {
                if ($scope.expandedState.isSet) {
                    if ($scope.expandedState.isExpanded) {
                        document.body.classList.remove('side-menu-compressed');
                    } else {
                        document.body.classList.add('side-menu-compressed');
                    }
                }
                $scope.expandedState.isSet = true;
                $scope.expandedState.isExpanded = document.body.classList.contains('side-menu-compressed');
            }

            $scope.expandPanel = function () {
                if (!$scope.expandedState.isSet) {
                    document.body.classList.remove('side-menu-compressed');
                }
            }

            $scope.collapsePanel = function () {
                if (!$scope.expandedState.isSet) {
                    document.body.classList.add('side-menu-compressed');
                }
            }

            $scope.exportCurrentData = function() {
                var currentExport = $scope.currentExport;
                $rootScope.exportSelection(currentExport);
            }

            // send support email
            $scope.sendSupportEmail = function () {
                $http.post('/support', {
                    message: document.forms[0].elements[0].value
                })
                .then(function(response) {
                    document.forms[0].elements[0].value = "";
                    document.getElementById("floatingForm").style.display = "none";
                }).catch(function(err) {
                    console.log(err)
                });
            }
            // toggle floating contact form
            $scope.toggleForm = function () {
              if (document.getElementById("floatingForm").style.display == "block") {
                document.getElementById("floatingForm").style.display = "none";
              } else {
                document.getElementById("floatingForm").style.display = "block";
              }
            }

            $scope.rightPanelTabs = [
                {
                    iconClass: 'info',
                    title: 'Info',
                    tooltipTitle: 'See project information',
                    panel: 'modal',
                    // highlighted: true,
                    cmd: function () {
                        $scope.panelUI.openPanel('modal');
                        if (!$window.localStorage.modal)
                            $timeout(function () {
                                ngIntroService.setOptions(
                                    {
                                        steps: [
                                            {
                                                element: '#firstLoad',
                                                intro: 'First Load just says Welcome to Mappr + a 250 wd max introduction'
                                            }
                                        ]
                                    }
                                );
                                //ngIntroService.start();
                            }, 100);
                    },
                },
                {
                    iconClass: 'snapshots',
                    title: 'Snapshots',
                    panel: 'slides',
                    tooltipTitle: 'See snapshot information and change views if there are more than one',
                    cmd: function () {
                        $scope.panelUI.openPanel('slides');
                        if (!$window.localStorage.slides)
                            $timeout(function () {
                                ngIntroService.setOptions(
                                    {
                                        steps: [
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
                                //ngIntroService.start();
                            }, 100);
                    }
                },
                {
                    iconClass: 'filter',
                    title: 'Filters',
                    panel: 'filter',
                    tooltipTitle: 'Filter data by one or more attributes',
                    cmd: function () {
                        $scope.panelUI.openPanel('filter');
                        if (!$window.localStorage.filter)
                            $timeout(function () {
                                ngIntroService.setOptions(FilterPanelService.getFilterIntroOptions());
                                //ngIntroService.start();
                            }, 100);
                    }
                },
                {
                    iconClass: 'legend',
                    title: 'Legend',
                    panel: 'summary',
                    tooltipTitle: 'See color and sizing information',
                    cmd: function () {
                        $scope.panelUI.openPanel('summary');
                    }
                },
                {
                    iconClass: 'list',
                    title: 'List',
                    showSelCount: true,
                    tooltipTitle: 'See the list view of selected nodes - or all nodes if none are selected',
                    panel: 'info',
                    cmd: function () {
                        $scope.panelUI.openPanel('info');
                    }
                },
                {
                    iconClass: 'export',
                    title: 'Export',
                    tooltipTitle: 'Export current selection',
                    cmd: function () {
                        $scope.exportCurrentData();
                    }
                }
            ];

            /**
             * Scope methods
             */

            /*************************************
             ****** Event Listeners/Watches *******
             **************************************/

            // $scope.$on(BROADCAST_MESSAGES.renderGraph.loaded, function() {
            //     updateSelCount();
            // });

            // $scope.$on(BROADCAST_MESSAGES.selectNodes, function() {
            //     updateSelCount();
            // });

            // $scope.$on(BROADCAST_MESSAGES.selectStage, function() {
            //     updateSelCount();
            // });

            // $rootScope.$on(BROADCAST_MESSAGES.cleanStage, function() {                
            //     updateSelCount();
            // });

            // $scope.$on(BROADCAST_MESSAGES.fp.currentSelection.changed, function() {
            //     updateSelCount();
            // });

            // $rootScope.$on(BROADCAST_MESSAGES.fp.initialSelection.changed, function() {
            //     updateSelCount();
            // });

            $rootScope.$on(BROADCAST_MESSAGES.hss.select, function (ev, data) {
                if (data.selectionCount == 0 && data.isSubsetted) {
                    $scope.currentExport = 'subset';
                    $scope.selNodesCount = subsetService.currentSubset().length;
                } else {
                    $scope.currentExport = data.filtersCount > 0 ? 'select': 'all';
                    $scope.selNodesCount = data.selectionCount;
                }
            });

            /*************************************
             ********* Initialise *****************
             **************************************/

            /*************************************
             ********* Core Functions *************
             **************************************/

            // function updateSelCount() {                
            //     $scope.selNodesCount = selectService.selectedNodes.length;
            // }

        }
    ]);
