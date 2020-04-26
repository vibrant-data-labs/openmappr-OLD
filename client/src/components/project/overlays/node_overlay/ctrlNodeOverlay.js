angular.module('common')
    .controller('NodeOverlayCtrl', ['$scope', '$rootScope', '$timeout', 'BROADCAST_MESSAGES', 'zoomService', 'nodeSelectionService', 'renderGraphfactory', 'dataGraph', 'graphSelectionService', 'partitionService', 'FilterPanelService', 'AttrInfoService', 'linkService',
        function($scope, $rootScope, $timeout, BROADCAST_MESSAGES, zoomService, nodeSelectionService, renderGraphfactory, dataGraph, graphSelectionService, partitionService, FilterPanelService, AttrInfoService, linkService) {
            'use strict';

            /*************************************
            ************ Local Data **************
            **************************************/
            var logPrefix = '[ctrlNodeOverlay: ] ';

            var snapData;
            var camPrefix = renderGraphfactory.getRenderer().options.prefix;
            var showNodeDetailOnLoad = false;
            var isGrid = false;
            //amount above center to start node overlay attr scroll container
            var scrollOffset = 160;
            var initOverlayNodeData = { //Used to transition node
                node: null,
                pos: {x: 0, y: 0}
            };

            /*************************************
            ********* Scope Bindings *************
            **************************************/
                    /**
            *  Scope data
            */
            $scope.mockData = true;
            $scope.beginOverlayAnim = false;
            $scope.beginOverlayRightPanel= false;
            $scope.showOverlayFocusNode = false;
            $scope.showOverlay = false;
            $scope.hideContent = true;
            $scope.showNeighborLine = false;
            $scope.nodeAttrs = [];
            $scope.sectionActive2 = 0;
            $scope.sectionActive3 = 0;
            $scope.nodeRightInfo= {};

            /**
            * Scope methods
            */
            $scope.cancelOverlay = cancelOverlay;
            $scope.switchToNeighbor = switchToNeighbor; //neighbor switch stuff
            $scope.drawNeighborLine = drawNeighborLine; //neighbor line drawing
            $scope.finishAnimation = finishAnimation; //for when finished (show overlay)
            $scope.activeTabs2 = activeTabs2;
            $scope.activeTabs3 = activeTabs3;

            $scope.removeNeighborLine = function() {
                //kill line
                $scope.showNeighborLine = false;
            };


            $scope.attrRenderClicked = function() {
                $scope.cancelOverlay(true);
                FilterPanelService.rememberSelection(false);
            };

            //for when finished (show overlay)
            $scope.finishNeighborAnimation = function() {
                $scope.showFocusNode = false;
                $timeout(function() {
                    graphSelectionService.selectByIds(Array($scope.neighborNode.id));

                });
            };

            /*************************************
            ****** Event Listeners/Watches *******
            **************************************/
            $(window).on('resize', onWindowResize); //on resize, move node to correct position
            $scope.$on(BROADCAST_MESSAGES.selectNodes, onNodesSelect);
            $scope.$on(BROADCAST_MESSAGES.grid.clickNode, onClickNode); //if in grid
            $scope.$on(BROADCAST_MESSAGES.list.clickNode, onClickNode); //if in list

            $scope.$on(BROADCAST_MESSAGES.snapshot.loaded, function onSnapLoad(e, data) {
                snapData = data;
                if(snapData.snapshot) {
                    showNodeDetailOnLoad = snapData.snapshot.layout.settings.showNodeDetailOnLoad && $scope.mapprSettings.nodeFocusShow;
                }
            });
            $scope.$on(BROADCAST_MESSAGES.snapshot.changed, function onSnapChange(e, data) {
                $scope.cancelOverlay(true);
                snapData = data;
                if(snapData.snapshot) {
                    showNodeDetailOnLoad = snapData.snapshot.layout.settings.showNodeDetailOnLoad && $scope.mapprSettings.nodeFocusShow;
                }
            });

            $scope.$on(BROADCAST_MESSAGES.nodeOverlay.highlightText, function(e, data) {
                $scope.searchQuery = _.get(data, 'text', '');
            });

            $scope.$on(BROADCAST_MESSAGES.nodeOverlay.remove, function() {
                $scope.cancelOverlay();
            });

            $scope.$on(BROADCAST_MESSAGES.dataGraph.nodeAttrsUpdated, function() {
                _buildNodeAttrsList();
                if($scope.focusNode) {
                    _buildAttrsPrincipalVal();
                }
            });

            $scope.$on(BROADCAST_MESSAGES.layout.attrClicked, function(event, data) {
                var infoObj = AttrInfoService.getNodeAttrInfoForRG();
                var attr = data.attr;
                var ele = angular.element(document.getElementById('overlayattr-'+attr.id));
                if(ele.length === 1) {
                    $timeout(function() {
                        angular.element(document.getElementById('detailbox-scroll')).scrollToElementAnimated(ele, 200);
                    }, 500);
                }
            });

            /*************************************
            ********* Initialise *****************
            **************************************/

                    /*************************************
            ********* Core Functions *************
            **************************************/

            function onNodesSelect(e, data) {
                // TODO: correct this bug
                // if(!$scope.mapprSettings) return;
                // else if(($scope.mapprSettings.nodeFocusShow || showNodeDetailOnLoad === true)
                // TODO: restore validation
                if(!$scope.mapprSettings) return;
                else if($scope.mapprSettings.nodeFocusShow && data.newSelection
                        && $scope.nodeOverlayProps.enabled && $scope.layout.plotType !== 'grid') {
                    if(_.isArray(data.nodes) && data.nodes.length === 1) {
                        //reset so only shows on snapshot load
                        showNodeDetailOnLoad = false;
                        isGrid = false;
                        //may not need
                        $scope.focusNode = data.nodes[0];
                        if($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel') $scope.beginOverlayRightPanel= true;
                        else $scope.beginOverlayAnim = true;

                        animateGraphToOverlay();
                    }
                    else if(_.isArray(data.nodes) && data.nodes.length > 1) {
                        $scope.cancelOverlay(true);
                    }
                }
            }

            function onClickNode(e, data) {
                if(($scope.mapprSettings.nodeFocusShow || showNodeDetailOnLoad === true) && $scope.nodeOverlayProps.enabled) {
                    //reset so only shows on snapshot load
                    showNodeDetailOnLoad = false;
                    isGrid = true;
                    //may not need
                    $scope.focusNode = data.node;
                    console.log('focus node: ', $scope.focusNode);
                    if($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel') $scope.beginOverlayRightPanel= true;
                    else $scope.beginOverlayAnim = true;

                    animateGraphToOverlay();
                }
            }

            function onWindowResize() {
                if(!$scope.showOverlay) { return; }

                $timeout(function() {
                    $scope.nodeStartData = {
                        x: window.innerWidth/2-415,
                        y: window.innerHeight/2,
                        size: 150
                    };
                    $scope.nodeEndData = {
                        x: window.innerWidth/2-415,
                        y: window.innerHeight/2,
                        size: 150
                    };

                    $scope.scrollPaddingTop = $(window).height()/2 - $('#detailbox-scroll div:first-child').height()/2 - scrollOffset;

                });
            }

            function cancelOverlay(isChangingSnap) {
                // console.log('cancel zoom level: ', zoomService.currentZoomLevel());
                if(!$scope.showOverlay) { //assuming showOverlay is the flag to check if overlay is currently open
                    console.warn(logPrefix + 'overlay is not open, wrongly called!');
                    return;
                }
                //hide node pop and overlay
                $scope.beginOverlayRightPanel= false;
                $scope.beginOverlayAnim = false;
                $scope.showFocusNode = false;
                $scope.showNeighborNode = false;
                $scope.showOverlay = false;
                //reverse graph animation
                if(!isChangingSnap) {
                    // Shift camera so that current node(or neighbour) is positioned at initial node's position
                    if(initOverlayNodeData.node) {
                        zoomService.shiftSavedCamCoords(-1 * initOverlayNodeData.pos.x, -1 * initOverlayNodeData.pos.y);
                        initOverlayNodeData.node = null;
                    }
                    // remove selection from filter service panel
                    FilterPanelService.updateInitialSelection([]);
                    // restore camera
                    zoomService.restoreCamera();
                    // graphSelectionService.clearSelections();
                    $rootScope.$broadcast(BROADCAST_MESSAGES.nodeOverlay.removing, {clearSelections: true});
                }
                else {
                    $rootScope.$broadcast(BROADCAST_MESSAGES.nodeOverlay.removing, {clearSelections: false});
                }
            }

            function switchToNeighbor(node, $event) {

                $scope.hideContent = true;
                $scope.removeNeighborLine();

                $scope.neighborNode = dataGraph.getRenderableGraph().getNodeById(node.id);

                //get position of neighbor clicked
                var $nDiv = $($event.currentTarget);
                var pos = $nDiv.offset();
                var top = pos.top+$nDiv.height()/2;

                //objects to pass to dirNodeFocus
                //start position and size
                console.log('finishNeighborNode', pos,window);
                
                $scope.neighborNodeStartData = {
                    x: pos.left-390,
                    y: top,
                    size: 55
                };
                //end position and size
                $scope.neighborNodeEndData = {
                    x: window.innerWidth/2 - ($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel' ? 375 : 415),
                    y: window.innerHeight/2 + ($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel' ? 25 : 0),
                    size: 150
                };
                
                //finally show the node
                $scope.showNeighborNode = true;
                zoomPosition($scope.neighborNode, 10 / $scope.focusNode[camPrefix + 'size']);
                
            }

            function zoomPosition (node, rel= false){
                var relDefault = 10 / node[camPrefix + 'size'];                
                var pos = {
                    x: node.x,
                    y: node.y
                };

                var offset = {
                    x: 246,
                    y: 25
                };

                zoomService.zoomToOffsetPosition(pos, rel ? rel : relDefault, offset, Array(node));
            }

            function drawNeighborLine(node, similarity, $event) {
                //get position of neighbor over
                var $nDiv = $($event.currentTarget);
                var pos = $nDiv.offset();
                //use width because close to circle size
                var top = pos.top+$nDiv.width()/2;
                var left = pos.left+$nDiv.width()/2-390;
                var top2 = window.innerHeight/2;
                var left2 = window.innerWidth/2-415;
                drawLink(left, top, left2, top2, node.colorStr, $scope.focusNode.colorStr, !similarity ? 3 : Math.ceil(similarity*4));
                $scope.showNeighborLine = true;
            }

            function finishAnimation() {
                $scope.showOverlay = true;
                $scope.showNeighborNode = false;
                $scope.hideContent = false;
                $scope.neighborNode = null;

                $timeout(function() {
                    $scope.scrollPaddingTop = $(window).height()/2 - 240;
                    $scope.shareMarginTop = -($(window).height()/2 - $scope.scrollPaddingTop - 80);

                    $('#detailbox-scroll').on('scroll', function() {
                        $scope.removeNeighborLine();
                    });

                    $('.share-btn').on('mouseenter', function() {
                        $(this).css({
                            color: $scope.focusNode.colorStr,
                            borderColor: $scope.focusNode.colorStr
                        });
                    });

                    $('.share-btn').on('mouseleave', function() {
                        $(this).css({
                            color: '',
                            borderColor:''
                        });
                    });
                });


            }

            function animateGraphToOverlay() {
                $rootScope.$broadcast(BROADCAST_MESSAGES.nodeOverlay.creating);

                // Initialise attrs
                _buildNodeAttrsList();

                // console.log('zoomToOffsetPosition', $scope.focusNode);
                // console.log('zoomToOffsetPosition', getCenterPoint());

                if(!isGrid) {
                    //get ratio to zoom based on current size of node pop and final size of node pop
                    var relRatio = (($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel') ? 10 : 50)/$scope.focusNode[camPrefix + 'size'];

                    //get amount to move graph based on node position and where it needs to end up
                    var pos = {
                        x: $scope.focusNode.x,
                        y: $scope.focusNode.y
                    };
                    var offset = {
                        x: 246,
                        y: 25
                    };

                    if($scope.showOverlay) {
                        initOverlayNodeData.pos.x = $scope.focusNode['read_camcam1:x'] - initOverlayNodeData.node['read_camcam1:x'];
                        initOverlayNodeData.pos.y = $scope.focusNode['read_camcam1:y'] - initOverlayNodeData.node['read_camcam1:y'];
                    }
                    else {
                        initOverlayNodeData.node = $scope.focusNode;
                    }

                    //save camera position (for going back)
                    if(!$scope.neighborNode && !$scope.showOverlay) {
                        zoomService.saveCamera();
                    }

                    //animate graph to position
                    zoomService.zoomToOffsetPosition(pos, relRatio, offset, Array($scope.focusNode));

                }

                //update attr display data
                _buildAttrsPrincipalVal();

                //push extra attr into nodeAttrs array if not already there so that
                //neighbors detail will be added in correct spot
                if($scope.mapprSettings.nodeFocusShowNeighbors) {
                    for(var i=0; i < $scope.allAttrs.length; i++) {
                        if((!$scope.nodeAttrs[i] || $scope.nodeAttrs[i].id != $scope.allAttrs[i].id) && $scope.mapprSettings.nodeFocusNeighborsBefore == $scope.allAttrs[i].id) {
                            $scope.nodeAttrs.splice(i, 0, $scope.allAttrs[i]);
                        }
                    }
                }

                //animate node focus to final position
                //objects to pass to dirNodeFocus
                //start position and size

                //if neighbor node, then node already in place so use end data as start data
                if($scope.neighborNode) {
                    //start position and size
                    $scope.nodeStartData = {
                        x: window.innerWidth/2-415,
                        y: window.innerHeight/2,
                        size: 150
                    };
                }else {
                    if(isGrid) {
                        $scope.nodeStartData = {
                            x: $scope.focusNode.gridX,
                            y: $scope.focusNode.gridY,
                            size: $scope.focusNode.gridSize
                        };
                    } else {
                        $scope.nodeStartData = {
                            x: $scope.focusNode[camPrefix + 'x'],
                            y: $scope.focusNode[camPrefix + 'y'] + 30,
                            size: $scope.mapprSettings.nodePopSize/10*75 + $scope.focusNode[camPrefix + 'size']
                        };
                    }
                }
                //end position and size
                $scope.nodeEndData = {
                    x: window.innerWidth/2-415,
                    y: window.innerHeight/2,
                    size: 150
                };

                //finally show the node if not content type, else just trigger overlay
                $scope.showFocusNode = true;
                if($scope.mapprSettings.nodeFocusRenderTemplate == 'content') {
                    $scope.finishAnimation();
                }else if ($scope.mapprSettings.nodeFocusRenderTemplate == 'node-right-panel'){
                    var selNodes = graphSelectionService.getSelectedNodes();
                    var nodesa = selNodes[0];

                    var nodeAttrsObj = dataGraph.getNodeAttrs();

                    const filteredAttr = nodeAttrsObj.filter(attr => {
                        return attr.visible && nodesa.attr[attr.title]
                    });

                    console.log({nodesa, nodeAttrsObj, filteredAttr});

                    mapRightPanel(filteredAttr, nodesa.attr);
                }

            }

            /*************************************
             ********* Helper functions for the attr map *************
             **************************************/

            function mapRightPanel(attrArray, values){
                var result = {
                    section1: [],
                    section2: [],
                    section3: [],
                    section4: [],
                    section5: [],
                };

                attrArray.map( (attr) => {
                    if(mapToSectionOne(attr)) result.section1.push({...setToSectionOne(attr, values[attr.id])});
                    if(mapToSectionTwo(attr)) result.section2.push({key: attr.id, value: values[attr.id]});
                    if(mapToSectionThree(attr)) result.section3.push({key: attr.id, value: values[attr.id]});
                    if(mapToSectionFour(attr)) result.section4.push({key: attr.id, value: values[attr.id]});
                    if(mapToSectionFive(attr)) result.section5.push({key: attr.id, value: values[attr.id]});
                });


                $scope.nodeRightInfo = result;
                console.log({nodeRightInfo: $scope.nodeRightInfo});
            }

            function setToSectionOne(attr, value = ''){
                if(attr.attrType === 'url') return ({ type: 'link', icon: 'https://image.flaticon.com/icons/svg/455/455691.svg', value });
                if(attr.id === 'Name') {
                    const [name, description] = value.split(':');
                    const [ first, last ] = name.split('');
                    const initials = first[0] + last[0];
                    return ({ type: 'name', name, description, initials, color: $scope.focusNode ? $scope.focusNode.colorStr : '8bc2cd' })
                }
            }

            /*************************************
             ********* Helper functions for the attr map *************
             **************************************/
            function mapToSectionOne(attr) {
                const { attrType, renderType, id } = attr;

                return (attrType === 'string' && renderType === 'text' && id === 'Name') ||
                    (attrType === 'url' && renderType === 'default')

            }
            function mapToSectionTwo(attr) {
                const { attrType, renderType } = attr;

                return (attrType === 'string' && renderType === 'text') ||
                    (attrType === 'video' && renderType === 'default') ||
                    (attrType === 'picture' && renderType === 'default') ||
                    (attrType === 'audio_stream' && renderType === 'default') ||
                    (attrType === 'video_stream' && renderType === 'default') ||
                    (attrType === 'twitter' && renderType === 'default') ||
                    (attrType === 'instagram' && renderType === 'default')
            }
            function mapToSectionThree(attr) {
                const { attrType, renderType } = attr;

                return (attrType === 'liststring' && renderType === 'tag-cloud')
            }
            function mapToSectionFour(attr) {
                const { attrType, renderType } = attr;

                return (attrType === 'integer' && renderType === 'histogram') ||
                 (attrType === 'float' && renderType === 'histogram') ||
                 (attrType === 'year' && renderType === 'histogram') ||
                 (attrType === 'timestamp' && renderType === 'histogram')
            }
            function mapToSectionFive(attr) {
                const { attrType, renderType } = attr;

                return (attrType === 'string' && renderType === 'tag-cloud')
            }

            function getName(completeName) {
                var names = completeName.split(':');
                if (names.length == 2){
                    return {
                        name : names[0],
                        description: names[1]
                    }
                }
                return { name: completeName };
            }
            function formatDate(num){
                var date =  new Date(num);
                var day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
                var month = (date.getMonth() +1) < 10 ? `0${(date.getMonth() +1)}` : (date.getMonth() +1) ;
                var year = date.getFullYear();
                
                return day + "/" + month + "/" + year;
            }
            function numberFormat(number){
                return new Intl.NumberFormat().format(number);;
            }
            function toM(num){
                return (num / 1000000).toFixed(2).toString() + 'M'
            }
            function parseToCommas(num){
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
            }

            //for drawing div line
            function drawLink(x1, y1, x2, y2, color1, color2, height){
                //swap colors if y1 > y2
                if(y1 > y2) {
                    var c = color1;
                    color1 = color2;
                    color2 = c;
                }

                if(y1 < y2){
                    var pom = y1;
                    y1 = y2;
                    y2 = pom;
                    pom = x1;
                    x1 = x2;
                    x2 = pom;
                }

                var a = Math.abs(x1-x2);
                var b = Math.abs(y1-y2);
                var sx = (x1+x2)/2 ;
                var sy = (y1+y2)/2 ;
                var width = Math.sqrt(a*a + b*b ) ;
                var x = sx - width/2;
                var y = sy;

                a = width / 2;

                c = Math.abs(sx-x);

                b = Math.sqrt(Math.abs(x1-x)*Math.abs(x1-x)+Math.abs(y1-y)*Math.abs(y1-y) );

                var cosb = (b*b - a*a - c*c) / (2*a*c);
                var rad = Math.acos(cosb);
                var deg = (rad*180)/Math.PI;
                var $div = $('.neighbor-line');
                console.log('height: ', height);
                $div.css({
                    width: width,
                    height: height,
                    transform: 'rotate('+deg+'deg)',
                    position:'absolute',
                    top:y,
                    left:x,
                    background: 'linear-gradient(to right, '+color1+', '+color2+')'
                });

            }

            function _buildNodeAttrsList() {
                var infoObj = AttrInfoService.getNodeAttrInfoForRG();
                var nodeAttrs = dataGraph.getNodeAttrs();
                $scope.allAttrs = _.clone(nodeAttrs);
                $scope.nodeAttrs = [];
                $scope.nodeInfoAttrs = [];

                _.each(nodeAttrs, function(attr) {
                    var attrClone = _.clone(attr);
                    var attrInfo = infoObj.getForId(attr.id);
                    var isInfoAttr = !AttrInfoService.isDistrAttr(attr, attrInfo);
                    attrClone.principalVal = null;
                    attrClone.isInfoAttr = isInfoAttr;
                    attrClone.showFilter = false;
                    if(isInfoAttr) {
                        attrClone.showRenderer = AttrInfoService.shouldRendererShowforSN(attr.attrType, attr.renderType);
                    }
                    else {
                        attrClone.showRenderer = true;
                    }
                    $scope.nodeAttrs.push(attrClone);

                    if(!AttrInfoService.isDistrAttr(attr, infoObj.getForId(attr.id))) {
                        $scope.nodeInfoAttrs.push(attrClone);
                    }
                });

            }

            function _buildAttrsPrincipalVal() {
                _.each($scope.nodeAttrs, function(attr) {
                    attr.principalVal = $scope.focusNode.attr[attr.id];
                    if(attr.principalVal){ //if value exists perform updates else skip
                        if(attr.attrType == 'float') {
                            if(_.isFunction(attr.principalVal.toFixed)) {
                                attr.principalVal = attr.principalVal.toFixed(2);
                            }
                            else {
                                console.warn("attrType & inferred type from value don\'t match for attrType - float and attrVal - ", attr.principalVal);
                            }
                        }
                    }
                });
            }

            function activeTabs2(newValue){
                $scope.sectionActive2 = newValue;
            }

            function activeTabs3(newValue){
                $scope.sectionActive3 = newValue;
            }

            //pending

            function getCenterPoint(){
                var neighbor = getNeihbors();
                neighbor.forEach((e) => {
                    console.log('getCenterPoint', e);
                });
            }

            function getNeihbors(){
                var  hasLinks, incomingEdgesIndex, outgoingEdgesIndex;
                var node = $scope.focusNode;
                var dataset = dataGraph.getRawDataUnsafe();
                incomingEdgesIndex = dataset.edgeInIndex[node.id];
                outgoingEdgesIndex = dataset.edgeOutIndex[node.id];
                hasLinks = $scope.hasLinks = _.size(incomingEdgesIndex) + _.size(outgoingEdgesIndex) > 0;
                if (hasLinks || $scope.extLinkedNodes) {
                   return linkService.constructLinkInfo(node, incomingEdgesIndex, outgoingEdgesIndex, $scope.mapprSettings.labelAttr, $scope.mapprSettings.nodeImageAttr);;
                } else {
                    console.log('dirNeighbors', "Node has no links to other nodes");
                }
            }
        }
    ]);
