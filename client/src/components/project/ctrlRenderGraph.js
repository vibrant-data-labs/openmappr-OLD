//RenderCtrl sets up dataGraph and the current Snapshot
// if an attribute is changed, loads the new graph!
angular.module('common')
    .controller('renderGraphCtrl', ['$scope', '$rootScope', '$routeParams','$q', '$timeout', '$location', 'leafletData', 'dataService','networkService' ,'dataGraph', 'AttrInfoService', 'layoutService', 'snapshotService', 'orgFactory', 'projFactory', 'playerFactory', 'graphSelectionService', 'zoomService', 'SelectorService', 'BROADCAST_MESSAGES',
        function($scope, $rootScope, $routeParams, $q, $timeout, $location, leafletData, dataService, networkService, dataGraph, AttrInfoService, layoutService, snapshotService,  orgFactory, projFactory, playerFactory, graphSelectionService, zoomService, SelectorService, BROADCAST_MESSAGES) {
            'use strict';


            /*************************************
    ************ Local Data **************
    **************************************/
            var logPrefix = '[ctrlRenderGraph: ] ';

            var playerLoadInfo = {
                hasCustomData: false, // Has any custom data to load
                hasUserInfo: false, //Has user info - name, pic,
                showExtUserOverlay: false, //whether to show ext user overlay
                userName:'',
                userPicUrl: '',
                userDistrVals: [],
                snap: {}, // which snap to load
                shouldZoom: false,
                custerName: '',
                nodeIdsToSelect: [],    // Node Ids specified in Url as connections & clusters
                initialNodeIds: []  //node ids if showing extuser but also want to select initial node ids and minimize user overaly
            };

            var fullReset = false;
            var disableFullReset = _.debounce(function() {
                fullReset = false;
            }, 2000);

            /*************************************
    ********* Scope Bindings *************
    **************************************/
            /**
    *  Scope data
    */
            $scope.zoomInfo = {
                zoomIn: _.noop,
                zoomOut: _.noop
            };
            $scope.rawDataId = null;
            $scope.plotType = 'original';
            $scope.enableUndo = false;
            $scope.enableRedo = false;

            /**
    * Scope methods
    */
            $scope.zoomInfo.zoomOut = zoomService.zoomOut;
            $scope.zoomInfo.zoomIn = zoomService.zoomIn;
            $scope.zoomInfo.zoomExtents = zoomExtents;
            $scope.zoomInfo.zoomReset = zoomService.zoomReset;
            $scope.switchSnapshot = switchSnapshot; //A function for children to switch between snapshots and networks

            $scope.updatePlotType = function(plotType) {
                $scope.plotType = plotType || 'original';
            };

            $scope.resetFilters = function() {
                $scope.$broadcast('RESETFILTERS');
            };

            $scope.subsetFilters = function subsetFilters() {
                $scope.$broadcast(BROADCAST_MESSAGES.fp.filter.changed);
            };

            $scope.undoFilters = function undoFilters() {
                $scope.$broadcast(BROADCAST_MESSAGES.fp.filter.undo);
            };

            $scope.redoFilters = function redoFilters() {
                $scope.$broadcast(BROADCAST_MESSAGES.fp.filter.redo);
            };





            /*************************************
    ****** Event Listeners/Watches *******
    **************************************/
            //ctrlProject broadcasts a project:load event on new project load
            $scope.$on(BROADCAST_MESSAGES.project.load, function(event, data) { onProjectOrPlayerLoad(event, data); });

            //ctrlPlayer broadcasts a player:load event on new player load
            $scope.$on(BROADCAST_MESSAGES.player.load, function(event, data) { onProjectOrPlayerLoad(event, data); });

            $scope.$on(BROADCAST_MESSAGES.network.changed, onNetworkChange);

            $scope.$on(BROADCAST_MESSAGES.fp.filter.undoRedoStatus, function(evt, undoRedoStatus) {
                $scope.enableUndo = undoRedoStatus.enableUndo;
                $scope.enableRedo = undoRedoStatus.enableRedo;
            });

            $scope.$on(BROADCAST_MESSAGES.fp.filter.reset, function handleReset() {
                $scope.enableUndo = false;
                $scope.enableRedo = false;
            });




            /*************************************
    ********* Initialise *****************
    **************************************/

            /*************************************
    ********* Core Functions *************
    **************************************/

            /// ZoomReset zooms to selection , and then a full reset.
            function zoomExtents() {
                var nodes = graphSelectionService.selectedNodesAndNeighbors();
                if(nodes && nodes.length > 0 && !fullReset) {
                    disableFullReset.cancel();
                    zoomService.zoomToNodes(nodes);
                    fullReset = true;
                    disableFullReset();
                } else {
                    zoomService.zoomReset();
                }
            }

            function onNetworkChange(event, eventData) {
                dataGraph.clear();
                layoutService.invalidateCurrent();
                AttrInfoService.clearRenderGraphCaches();
                $scope.updatePlotType(_.get(eventData, 'snapshot.layout.plotType' , 'original'));
                var data = loadSuccess(networkService.getCurrentNetwork());
                $rootScope.$broadcast(BROADCAST_MESSAGES.dataGraph.loaded, data);
                $scope.$broadcast(BROADCAST_MESSAGES.snapshot.loaded, {
                    snapshot : eventData && eventData.snapshot ? eventData.snapshot : null
                });
            }

            /**
     * This function starts the rendering loop:
     * Steps
     * - Load the snapshot
     * - load the dataset
     * - generate layout
     * - generate rendergraph
     * - broadcast event : layout.loaded
     * @param  {event}
     * @param  {version Info data} // this is stupid
     * @return {nothing}
     */
            function onProjectOrPlayerLoad (event) {
                console.group('renderGraphCtrl.onProjectOrPlayerLoad');
                dataGraph.clear();
                layoutService.invalidateCurrent();
                graphSelectionService.clearSelections();
                snapshotService.clear();
                var snapIdP = null;
                $scope.updatePlotType('original');

                if (event.name === BROADCAST_MESSAGES.project.load) {
                    playerFactory.clear();
                    snapIdP = projFactory.currProject().then(loadProjectSnapshot);
                } else {
                    snapIdP = playerFactory.currPlayer(true).then(loadPlayerSnapshot);
                }
                // snapshots loaded or there were no snapshots.
                var rawDataP = dataService.currDataSet().then(function(dataSet){
                    _.each(networkService.getNetworks(), AttrInfoService.loadInfoForNetwork, AttrInfoService);
                    return dataSet;
                }).catch( function(err) {
                    console.log('Error in empty Project!', err);
                    dataGraph.clear();
                    $rootScope.$broadcast(BROADCAST_MESSAGES.dataGraph.loaded, null);
                    $scope.$broadcast(BROADCAST_MESSAGES.dataGraph.empty);
                    return $q.reject(err);
                });

                $q.all({ snapId : snapIdP, rawData : rawDataP})
                    .then(function(obj) {
                        var snapId = obj.snapId;
                        var snap = snapId != null ? snapshotService.getById(snapId) : null;
                        if(snapId) {
                            $scope.updatePlotType(snap.layout.plotType);
                            var onSigma = graphSelectionService.loadFromSnapshot(snapshotService.getById(snapId));
                            snapshotService.setCurrentSnapshot(snapId);
                            loadNetworkForSnapshot(snapId);

                            var x = $scope.$on(BROADCAST_MESSAGES.sigma.rendered, function() {
                                // Build connections obj
                                checkforCustomSelections();

                                // Check if OnSigma needs to be updated for player
                                if(event.name === BROADCAST_MESSAGES.player.load) {
                                    if(playerLoadInfo.hasUserInfo) {
                                        onSigma = _.noop;
                                        console.log('playerLoadInfo: ', playerLoadInfo);
                                        $scope.$emit(BROADCAST_MESSAGES.extUserOverlay.create, playerLoadInfo);

                                        $scope.$on(BROADCAST_MESSAGES.extUserOverlay.minimized, function() {
                                            graphSelectionService.selectByIds(playerLoadInfo.initialNodeIds, 0);
                                            $scope.zoomInfo.zoomExtents();
                                        });

                                        if(playerLoadInfo.initialNodeIds) {
                                            $timeout(function() {
                                                graphSelectionService.selectByIds(playerLoadInfo.initialNodeIds, 0);
                                                $scope.zoomInfo.zoomExtents();
                                            });
                                        }

                                        $scope.$on(BROADCAST_MESSAGES.extUserOverlay.close, function(e, data) {
                                            if(data && data.distrClick) {
                                                console.log(logPrefix + 'distribution click, dont show user connections');
                                                return;
                                            }
                                            if(data && data.switchedToNeighbour) {
                                                var x = $scope.$on(BROADCAST_MESSAGES.nodeOverlay.removing, function() {
                                                    x();
                                                    graphSelectionService.selectByIds(playerLoadInfo.nodeIdsToSelect, 0);
                                                });
                                            }
                                            else {
                                                graphSelectionService.selectByIds(playerLoadInfo.nodeIdsToSelect, 0);
                                            }
                                            $scope.zoomInfo.zoomExtents();
                                        });
                                    }
                                    else if(playerLoadInfo.hasCustomData) {
                                        if(playerLoadInfo.nodeIdsToSelect.length > 0) {
                                            onSigma = function() {
                                                console.log(logPrefix + 'ignoring snap selections, loading selections specified in URL');
                                                $timeout(function() {
                                                    graphSelectionService.selectByIds(playerLoadInfo.nodeIdsToSelect, 0); //zero degree selection
                                                });
                                                if(playerLoadInfo.shouldZoom) {
                                                    setTimeout(function() {
                                                        $scope.zoomInfo.zoomExtents();
                                                    }, 300);
                                                }
                                            };
                                        }
                                    }
                                }
                                onSigma();
                                x();
                            });

                        } else {
                            loadNetworkForSnapshot(null);
                        }
                        var data = loadSuccess(networkService.getCurrentNetwork());
                        $rootScope.$broadcast(BROADCAST_MESSAGES.dataGraph.loaded, data);
                        console.log('triggering snapshost laoded');
                        $rootScope.$broadcast(BROADCAST_MESSAGES.snapshot.loaded, {
                            snapshot : snap
                        });
                        console.groupEnd();
                    });
            }

            /** Switches between snapshots of the project
    * - generates layout
    * - broadcasts : layout:changed
    * - selects nodes
    */
            function switchSnapshot(snapId) {
                console.log('Switching to snapshot with id: %O', snapId);
                var snap = snapshotService.getById(snapId),
                    onSigma = _.noop;
                if(!snap) {
                    console.warn('no snapshot to load! given Id:' + snapId);
                    return;
                }
                $scope.updatePlotType(snap.layout.plotType);
                layoutService.invalidateCurrent();
                snapshotService.setCurrentSnapshot(snap.id);
                var currentNWId = networkService.getCurrentNetwork().id;
                loadNetworkForSnapshot(snap.id);
                // regen Data when new network is being loaded
                if(currentNWId !== networkService.getCurrentNetwork().id) {
                    dataGraph.clear();
                    AttrInfoService.clearRenderGraphCaches();
                    var data = loadSuccess(networkService.getCurrentNetwork());
                    $rootScope.$broadcast(BROADCAST_MESSAGES.dataGraph.loaded, data);
                }
                $scope.$broadcast(BROADCAST_MESSAGES.snapshot.changed, {
                    snapshot : snap
                });
                // select nodes when render is complete
                if(snap.processSelection) {
                    onSigma = graphSelectionService.loadFromSnapshot(snap);
                }
                var x = $scope.$on(BROADCAST_MESSAGES.sigma.rendered, function() {
                    onSigma();
                    x();
                });
            }

            function loadSuccess(network) {
                console.group('renderGraphCtrl.loadSuccess');
                console.log('Merging Loading network :%O', network);
                var frag = dataGraph.mergeAndLoadNetwork(network);
                AttrInfoService.loadInfoForNetwork(network);
                $scope.rawDataId = frag.id;

                console.groupEnd();
                return frag;
            }

            function loadNetworkForSnapshot (snapId) {
                var currSnap = snapshotService.getById(snapId);
                var nwId = currSnap && currSnap.networkId ? currSnap.networkId : null;
                if(nwId != null && networkService.exist(nwId)) {
                    console.log("Loading snapshot network: ", nwId);
                    networkService.setCurrentNetwork(nwId);
                } else {
                    var defNwId = networkService.getDefault().id;
                    console.log("Loading a default network: ", defNwId);
                    networkService.setCurrentNetwork(defNwId);
                }
            }

            ///
            /// Setup Snapshots
            ///

            /**
     * Loads snapshots for project and creates a new one if none exist.
     */
            function loadProjectSnapshot (project, snapIdToSwitch) {
                console.group('ctrlRenderGraph.loadProjectSnapshot %O', project);
                var currSnapId = null;
                return snapshotService.loadSnapshots()
                    .then(function(snaps) {
                        if(snaps.length > 0) {
                            console.log('loading existing snapshot from snapshots: %O', snaps);
                            if(snapIdToSwitch && _.contains(_.pluck(snaps, 'id'), snapIdToSwitch)) {
                                currSnapId = snapIdToSwitch;
                                console.log(currSnapId);
                            } else {
                                console.log('No snapshot Id given to load, or snapId is invalid, so loading the 1st one.');
                                currSnapId = snapshotService.getLastViewedSnapId();
                                currSnapId = _.contains(_.pluck(snaps, 'id'), currSnapId) ? currSnapId : snaps[0].id;
                            }
                            console.groupEnd();
                            return currSnapId;
                        }
                        else {
                            console.log('No snapshots to load');
                            console.groupEnd();
                            return currSnapId;
                        }
                    }).catch(function(err) {
                        console.log('ctrlRenderGraph.loadProjectSnapshot', err);
                        return $q.reject(err);
                    });

            }

            function loadPlayerSnapshot (player) {
                console.group('ctrlRenderGraph.loadPlayerSnapshots', player);
                var currSnapId = null;
                return snapshotService.loadSnapshots(true)
                    .then(function(snaps) {
                        if(snaps.length > 0) {
                            console.log('loading existing snapshot from snapshots: %O', snaps);
                            decodePlayerLoadInfo(snaps);
                            currSnapId = playerLoadInfo.snap.id;
                            console.groupEnd();
                            return currSnapId;
                        }
                        else {
                            console.log('No snapshots to load');
                            console.groupEnd();
                            return currSnapId;
                        }
                    }).catch(function(err) {
                        console.log('ctrlRenderGraph.loadPlayerSnapshot', err);
                        return $q.reject(err);
                    });

            }

            function decodePlayerLoadInfo(snaps) {
                var pathSplitArr = $location.path().split('/');
                var urlSearchObj = $location.search();
                var viewPath = _.last(pathSplitArr);

                var snapNum = urlSearchObj.snapnum;
                var userName = urlSearchObj.uname;
                var userPicUrl = urlSearchObj.upic;

                playerLoadInfo.snap = snaps[0];

                if(pathSplitArr.length > 0 && (viewPath == 'select' || viewPath == 'compare')) {
                    if(viewPath == 'select') {
                        playerLoadInfo.hasCustomData = true;
                    }
                    else if(viewPath == 'compare') {
                        playerLoadInfo.hasUserInfo = true;
                    }
                }
                else {
                    console.info(logPrefix + 'no custom data specified, loading player normally');
                    return;
                }

                /**
        *  Build playerLoadInfo object
        */

                // Finds which snapshot to load
                if(snapNum && (+snapNum)%1===0) {
                    if(+snapNum <= snaps.length) {
                        playerLoadInfo.snap = snaps[+snapNum - 1];
                        console.log(logPrefix + 'Snapshot num to load found in Url');
                    }
                    else {
                        console.error(logPrefix + 'snap number greater than snaps count');
                    }
                }
                if(urlSearchObj.zoom == true || urlSearchObj.zoom == 'true') {
                    playerLoadInfo.shouldZoom = true;
                }

                playerLoadInfo.userName = userName;
                playerLoadInfo.userPicUrl = userPicUrl;

            }

            // Build node Ids list if any and updates in playerLoadInfo
            function checkforCustomSelections() {
                // Find selections
                var urlSearchObj = $location.search();
                var nodeIds = [],
                    initialNodeIds = [], //if has user info and node ids
                    clusterVal,
                    distrVals = [],
                    clusterKey = 'Cluster';

                if(playerLoadInfo.hasUserInfo) {
                    playerLoadInfo.showExtUserOverlay = true;
                    nodeIds = urlSearchObj.uconn ? urlSearchObj.uconn.split('+') : []; // Individual node Ids specified
                    clusterVal = urlSearchObj.uclust ? urlSearchObj.uclust : ''; //Cluster vals
                    distrVals = urlSearchObj.udata ? urlSearchObj.udata.split('+') : []; // Choose an appropriate separator
                    //node ids and/or cluster ids to select initially
                    if(urlSearchObj.nids) {
                        initialNodeIds = urlSearchObj.nids ? urlSearchObj.nids.split('+') : []; // Individual node Ids specified
                        var clusterIds = urlSearchObj.cids ? urlSearchObj.cids.split('+') : []; //Cluster vals

                        _.each(clusterIds, function(cid) {
                            var selector = SelectorService.newSelector();
                            selector.ofCluster(clusterKey, cid, true); //Need to confirm the cluster attrib name
                            selector.selectfromDataGraph();
                            if(_.isArray(selector.nodeIds)) {
                                initialNodeIds = initialNodeIds.concat(selector.nodeIds);
                            }
                        });

                        playerLoadInfo.showExtUserOverlay = false;
                        playerLoadInfo.initialNodeIds = initialNodeIds;
                    }
                    // var nwAttrIds = _.map(networkService.getCurrentNetwork().nodeAttrDescriptors, 'id');
                    // var clustersIdx = nwAttrIds.indexOf('Cluster');
                    // var clusterKey = 'Cluster';
                    playerLoadInfo.clusterVal = clusterVal;
                    playerLoadInfo.userDistrVals = distrVals;
                }
                else if(playerLoadInfo.hasCustomData) {
                    nodeIds = urlSearchObj.nids ? urlSearchObj.nids.split('+') : []; // Individual node Ids specified
                    clusterIds = urlSearchObj.cids ? urlSearchObj.cids.split('+') : []; //Cluster vals

                    _.each(clusterIds, function(cid) {
                        var selector = SelectorService.newSelector();
                        selector.ofCluster(clusterKey, cid, true); //Need to confirm the cluster attrib name
                        selector.selectfromDataGraph();
                        if(_.isArray(selector.nodeIds)) {
                            nodeIds = nodeIds.concat(selector.nodeIds);
                        }
                    });

                }

                console.log(logPrefix + 'Node IDs list from selections found in URL: ', nodeIds);
                playerLoadInfo.nodeIdsToSelect = nodeIds;
                return nodeIds;
            }

        }
    ]);
