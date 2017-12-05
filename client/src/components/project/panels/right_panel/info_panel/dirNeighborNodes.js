angular.module('common')
.directive('dirNeighborNodes', ['graphSelectionService', 'graphHoverService', 'linkService', 'dataGraph', 'zoomService', 'FilterPanelService',
function(graphSelectionService, graphHoverService, linkService, dataGraph, zoomService, FilterPanelService) {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'AE',
        templateUrl: '#{server_prefix}#{view_path}/components/project/panels/right_panel/info_panel/neighborNodes.html',
        scope: {
            nodeNeighbors: '=',
            linkInfoAttrs: '='
        },
        link: postLinkFn
    };

    /*************************************
    ************ Local Data **************
    **************************************/
    var ITEMS_TO_SHOW = 100;
    var ITEMS_TO_SHOW_INITIALLY = 10;


    /*************************************
    ******** Controller Function *********
    **************************************/


    /*************************************
    ******** Post Link Function *********
    **************************************/
    function postLinkFn(scope) {
        scope.neighborSearchQuery = '';

        // sort model
        scope.neighborsSort = '';

        // Sort types for neighbor sort menu
        scope.sortTypes = _.map(scope.linkInfoAttrs, function(attr) {
            return {
                id: attr.id,
                title: attr.title
            };
        });
        scope.sortTypes.push({
            id: 'label',
            title: 'Name'
        });

        // Sort info object used to create sort model string
        scope.sortInfo = {
            sortType: _.find(scope.sortTypes, 'id', 'similarity') ? 'similarity' : scope.sortTypes[0].id,
            sortOrder: 'desc'
        };

        scope.setNeighborSort = setNeighborSort;
        scope.numShowGroups = 0;
        scope.viewLimit = Math.min(ITEMS_TO_SHOW_INITIALLY, scope.nodeNeighbors.length);

        scope.setNeighborSort();

        //if click on neighbor in list of nodeNeighbors
        scope.selectNode = selectNode;

        scope.$watch('sortInfo', function(sortInfo) {
            console.log('dirNeighborNodes: sortInfo', sortInfo);
            scope.setNeighborSort();
        }, true);

        scope.viewMore = function() {
            if(scope.viewLimit < scope.nodeNeighbors.length) {
                scope.numShowGroups++;
                scope.viewLimit = Math.min(scope.nodeNeighbors.length, scope.numShowGroups * ITEMS_TO_SHOW + ITEMS_TO_SHOW_INITIALLY);
            }
        };

        scope.viewLess = function() {
            scope.numShowGroups = 0;
            scope.viewLimit = Math.min(ITEMS_TO_SHOW_INITIALLY, scope.nodeNeighbors.length);
        };

        scope.addNeighborsToSelection = function() {
            var nids = _.pluck(graphSelectionService.getSelectedNodeNeighbours(), 'id');
            graphSelectionService.selectByIds(nids, 0);
            FilterPanelService.rememberSelection(false);
        };

        scope.hoverNode = function(nodeId) {
            graphHoverService.hoverByIds([nodeId], 1, false);
        };

        scope.unHoverNode = function(nodeId) {
            graphHoverService.unhoverByIds([nodeId]);
        };

        scope.getNeighborInfoHtml = function(neighbor) {
            var html = '<ul class="list-unstyled" style="margin-bottom: 0">';
            if(_.isEmpty(scope.linkInfoAttrs)) { return ''; }
            _.each(scope.linkInfoAttrs, function(attr) {
                var attrId = attr.id;
                var attrVal = neighbor[attrId];
                if (_.isNumber(attrVal) && !Number.isInteger(attrVal)) { attrVal = attrVal.toFixed(2); }
                var attrLabel = attrId !== 'label' ? _.startCase(attr.title) : 'Name';
                html += '<li><b>' + attrLabel + ':</b> ' + attrVal + '</li>';
            });
            html += '</ul>';
            return html;
        };

        function setNeighborSort() {
            scope.neighborsSort = scope.sortInfo.sortType;
            if (scope.sortInfo.sortOrder === 'desc') { scope.neighborsSort = '-' + scope.neighborsSort; }
        }
    }



    /*************************************
    ************ Local Functions *********
    **************************************/
    function selectNode(id) {
        graphSelectionService.runFuncInCtx(function() {
            graphSelectionService.selectByIds(id, 1);
            zoomService.centerNode(_.first(graphSelectionService.getSelectedNodes()));
        }, true, true);
        FilterPanelService.rememberSelection(false);
    }


    return dirDefn;
}
]);
