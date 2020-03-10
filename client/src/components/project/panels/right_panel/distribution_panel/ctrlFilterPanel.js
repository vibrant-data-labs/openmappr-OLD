angular.module('common')
.controller('FilterPanelCtrl', ['$scope', '$rootScope', '$timeout', 'FilterPanelService', 'SelectorService', 'dataGraph', 'AttrInfoService', 'graphSelectionService', 'layoutService', 'nodeSelectionService', 'uiService', 'attrUIService', 'renderGraphfactory', 'networkService', 'BROADCAST_MESSAGES',
function($scope, $rootScope, $timeout, FilterPanelService, SelectorService, dataGraph, AttrInfoService, graphSelectionService, layoutService, nodeSelectionService, uiService, attrUIService, renderGraphfactory, networkService, BROADCAST_MESSAGES){
    'use strict';

    /*************************************
    ************ Local Data **************
    **************************************/
    var logPrefix = '[ctrlFilterPanel: ] ';

    /*************************************
    ********* Scope Bindings *************
    **************************************/
    /**
    *  Scope data
    */
    $scope.nodeDistrAttrs = [];
    $scope.currentSelection = [];
    $scope.MAPP_EDITOR_OPEN = $rootScope.MAPP_EDITOR_OPEN;

    /**
    * Scope methods
    */
    $scope.resetFilters = resetFilters;


    /*************************************
    ****** Event Listeners/Watches *******
    **************************************/
    $scope.$on(BROADCAST_MESSAGES.dataGraph.loaded, function() {
        var x = $scope.$on(BROADCAST_MESSAGES.sigma.rendered, function() {
            x();
            initialise(true);
        });
    });
    $scope.$on(BROADCAST_MESSAGES.selectNodes, onNodeSelect);
    $scope.$on(BROADCAST_MESSAGES.selectStage, onStageSelect);
    $scope.$on(BROADCAST_MESSAGES.snapshot.changed, onSnapshotChange);
    $scope.$on(BROADCAST_MESSAGES.fp.filter.changed, onFilterSubset);
    $scope.$on(BROADCAST_MESSAGES.fp.filter.undo, onFilterUndo);
    $scope.$on('TOGGLEFILTERS', toggleFiltersVisiblity);
    $scope.$on('RESETFILTERS', resetFilters);

    $scope.$on('$destroy', function() {
        $scope.ui.renderDistr = false;
    });


    /*************************************
    ********* Initialise *****************
    **************************************/
    dataGraph.getRawData().then(function (resolve) {
        initialise(!FilterPanelService.isInitialized());
    });

    networkService.getCurrentNetworkPromisified().then(function(currentNetworkP) {
        $scope.ui.renderDistr = true;
        $scope.ui.enableFilters = true;
    });

    /*************************************
    ********* Core Functions *************
    **************************************/

    function initialise(clearServiceState) {
        console.log(logPrefix + "initializing...");
        var newSelection;

        // Initialise bases on panel state
        if(clearServiceState) {
            FilterPanelService.init();
        }
        if(FilterPanelService.shouldReplaceNewSel()) {
            newSelection = graphSelectionService.getSelectedNodes() || [];
            FilterPanelService.updateInitialSelection(newSelection);
            $rootScope.$broadcast(BROADCAST_MESSAGES.fp.currentSelection.changed, {nodes: newSelection});
            if(FilterPanelService.getActiveFilterCount() > 0) {
                FilterPanelService.applyFilters();
                updateSelAndGraph(window.event);
            }
        }
        else {
            newSelection = FilterPanelService.getInitialSelection();
        }

        // Build distribution attrs list
        var infoObj = AttrInfoService.getNodeAttrInfoForRG();
        $scope.nodeDistrAttrs = [];
        _.each(dataGraph.getNodeAttrs(), function(attr) {
            if(AttrInfoService.isDistrAttr(attr, infoObj.getForId(attr.id))) {
                var attrClone = _.clone(attr);
                attrClone.principalVal = null;
                attrClone.fpHeight = null;
                attrClone.disableFilter = newSelection.length === 1 ? true : false;
                $scope.nodeDistrAttrs.push(attrClone);
            }
        });
        $scope.ui.totalAttrsCount = $scope.nodeDistrAttrs.length;

        // move network attrs to top
        var networkAttrs = networkService.getNetworkAttrs(networkService.getCurrentNetwork().id);
        $scope.nodeDistrAttrs = _($scope.nodeDistrAttrs)
                                .partition(function(attr) { return networkAttrs.indexOf(attr.id) > -1; })
                                .flatten()
                                .value();
        updateNodeColorStr();
        // Set 'sortType' for tag attrs
        setSortForTags($scope.nodeDistrAttrs, !_.isEmpty(newSelection));
        $scope.currentSelection = FilterPanelService.getCurrentSelection();
        console.log('current selection: ', $scope.currentSelection)
        $scope.$broadcast(BROADCAST_MESSAGES.fp.panel.rebuild, {nodes: newSelection});
        updateInfoData($scope.currentSelection);
    }

    function onNodeSelect(ev, data) {
        if(!data.newSelection) {
            console.warn(logPrefix + 'ignoring selection reset for intermediate selection');
            return;
        }
        resetInitialSelection(data && data.nodes ? data.nodes : []);
    }

    function onStageSelect() {
        resetInitialSelection([]);
    }

    function onSnapshotChange(ev, data) {
        var x = $scope.$on(BROADCAST_MESSAGES.sigma.rendered, function() {
            x();
            if(data.snapshot && data.snapshot.processSelection) {
                resetInitialSelection(graphSelectionService.getSelectedNodes());
            }
            else {
                console.warn(logPrefix + 'carrying over previous selection on snapshot change, so not resetting initial selection for filter panel.');
            }
        });
    }
    // reset panel with the new selection
    function resetInitialSelection(nodes) {
        console.log(logPrefix + "resetInitialSelection called");
        var newSelection = _.isArray(nodes) ? nodes : [];

        FilterPanelService.init();
        FilterPanelService.updateInitialSelection(newSelection);
        $scope.currentSelection = FilterPanelService.getCurrentSelection();
        updateNodeColorStr();
        if(_.isArray(nodes) && nodes.length === 1) {
            _.each($scope.nodeDistrAttrs, function (attr) {
                attr.disableFilter = true;
            });
        }
        // Set 'sortType' for tag attrs
        setSortForTags($scope.nodeDistrAttrs, newSelection.length > 0);
        
        if (!nodes || nodes.length < 1) {
            graphSelectionService.clearSelections(true);
        }

        $rootScope.$broadcast(BROADCAST_MESSAGES.fp.initialSelection.changed, {nodes: newSelection});
        
        updateInfoData($scope.currentSelection);
    }

    function onFilterSubset(ev) {
        FilterPanelService.applyFilters();

        FilterPanelService.appendToSelectionHistory(FilterPanelService.getAttrFilterConfigMap());

        _selectNodes(ev);
    }

    function onFilterUndo() {
        FilterPanelService.undoFilterFromSelectionHistory();

        _selectNodes();        
    }

    function resetFilters() {
        FilterPanelService.resetFilters();
        $scope.$broadcast(BROADCAST_MESSAGES.fp.filter.reset);
        updateSelAndGraph(window.event);
    }

    function updateNodeColorStr () {
        var layout = layoutService.getCurrentIfExists();
        if(layout) {
            $scope.nodeColorStr = FilterPanelService.genColorString(layout.setting('nodeColorAttr'));
        } else {
            $scope.nodeColorStr = FilterPanelService.getColorString();
        }
    }

    function updateInfoData(selection) {
        if(!_.isArray(selection)) throw new Error('Array expected');
        if(selection.length > 0) {
            $scope.nodeCountInGraph = selection.length;
        }
        else {
            $scope.nodeCountInGraph = dataGraph.getAllNodes().length;
        }
        $scope.ui.activeFilterCount = FilterPanelService.getActiveFilterCount();

        var infoObj = AttrInfoService.getNodeAttrInfoForRG();
        if(selection.length === 1) {
            var node = selection[0];
            _.each($scope.nodeDistrAttrs, function(attr) {
                var attrInfo = infoObj.getForId(attr.id);
                var nodeVal = node.attr[attr.id];
                attr.spHeight = attrUIService.getAttrFPHeight(attrInfo, $scope.ui.enableFilters);
                attr.principalVal = nodeVal;
                if(attr.principalVal){ //if principalVal exist else skip mods
                    if(attr.attrType == 'float') {
                        attr.principalVal = attr.principalVal.toFixed(2);
                    }
                }
                // attr.disableFilter = true;
            });
        }
        else {
            _.each($scope.nodeDistrAttrs, function(attr) {
                var attrInfo = infoObj.getForId(attr.id);
                attr.spHeight = attrUIService.getAttrFPHeight(attrInfo, $scope.ui.enableFilters);
                attr.principalVal = null;
                attr.disableFilter = false;
            });
        }

        // Hack
        if(!$scope.$$phase && !$rootScope.$$phase) {
            $scope.$apply();
        }
    }

    function toggleFiltersVisiblity() {
        var infoObj = AttrInfoService.getNodeAttrInfoForRG();
        _.each($scope.nodeDistrAttrs, function(attr) {
            var attrInfo = infoObj.getForId(attr.id);
            attr.showFilter = $scope.ui.enableFilters;
            attr.spHeight = attrUIService.getAttrFPHeight(attrInfo, $scope.ui.enableFilters);
        });
        FilterPanelService.updateFiltersVis($scope.ui.enableFilters);
        $scope.$broadcast(BROADCAST_MESSAGES.fp.filter.visibilityToggled, {filtersVisible: $scope.ui.enableFilters});
    }

    function updateSelAndGraph(ev) {
        var currentSelection = FilterPanelService.getCurrentSelection(),
            renderer = renderGraphfactory.getRenderer();

        $scope.currentSelection = currentSelection;
        if(!currentSelection || (_.isArray(currentSelection) && currentSelection.length === 0)) {
            if(FilterPanelService.getActiveFilterCount() > 0) {
                graphSelectionService.clearSelections();
                //Hack to show graph darkened state
                renderer.render({drawLabels: false});
                renderer.greyout(true, 'select');
            }
            else {
                graphSelectionService.clearSelections(true);
            }

            // UI SERVICE not available in player ,removing this for now
            // uiService.log('Nothing matches the selection criteria!');
        }
        else {
            sigma.renderers.common.prototype.render.call(renderer, true, false, renderer.settings); //Hack to render labels after graph darkened state
            nodeSelectionService.selectNodeIdList(_.map(currentSelection, 'id'), ev, false, true);
            updateNodeColorStr();
        }

        updateInfoData($scope.currentSelection);
        $rootScope.$broadcast(BROADCAST_MESSAGES.fp.currentSelection.changed, {nodes: currentSelection});
    }

    function setSortForTags(attrs, selectionMode) {
        _.each(attrs, function(attr) {
            if ((attr.renderType === 'tags' || attr.renderType === 'tag-cloud')
                && _.get(attr, 'sortOps.sortType') !== 'alphabetical') {
                attr.sortOps.sortType = selectionMode ? 'statistical' : 'frequency';
            }
        });
    }

    function _selectNodes(ev) {
        updateSelAndGraph(ev);
        if(_.isEmpty(FilterPanelService.getInitialSelection())) {
            $scope.$evalAsync(function() {
                FilterPanelService.rememberSelection(true);
            });
        }
    }


}
]);
