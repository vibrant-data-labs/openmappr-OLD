angular.module('common')
.directive('dirNodesList', ['BROADCAST_MESSAGES', 'graphHoverService', 'graphSelectionService', 'FilterPanelService', 'layoutService',
function(BROADCAST_MESSAGES, graphHoverService, graphSelectionService, FilterPanelService, layoutService) {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'AE',
        require: '?^dirSelectionInfo',
        scope: {
            nodes: '=',
            labelAttr: '=',
            nodeColorAttr: '=',
            panelMode: '=',
            selectedGroups: '=',
            sortTypes: '=',
            sortInfo: '=',
        },
        templateUrl: '#{server_prefix}#{view_path}/components/project/panels/right_panel/info_panel/nodesList.html',
        link: postLinkFn
    };

    /*************************************
    ************ Local Data **************
    **************************************/
    // var logPrefix = 'dirNodesList: ';
    var ITEMS_TO_SHOW = 100;
    var ITEMS_TO_SHOW_INITIALLY = 20;


    /*************************************
    ******** Controller Function *********
    **************************************/

    /*************************************
    ******** Post Link Function *********
    **************************************/
    function postLinkFn(scope, elem, attrs, parCtrl) {

        var memoizedGetFunctionColor = _.memoize(getFunctionColor);

        scope.nodeSearchQuery = '';
        scope.numShowGroups = 0;
        scope.viewLimit = Math.min(ITEMS_TO_SHOW_INITIALLY, scope.nodes.length);

        layoutService.getCurrent().then(function (layout) {
            scope.layout = layout;
        });

        scope.$watch('nodes', function() {
            scope.viewLimit = Math.min(ITEMS_TO_SHOW_INITIALLY, scope.nodes.length);
        });

        scope.viewMore = function() {
            if(scope.viewLimit < scope.nodes.length) {
                // scope.viewLimit += Math.min(minViewCount, scope.nodes.length - scope.viewLimit);
                scope.numShowGroups++;
                scope.viewLimit = Math.min(scope.nodes.length, scope.numShowGroups * ITEMS_TO_SHOW + ITEMS_TO_SHOW_INITIALLY);
            }
        };

        scope.viewLess = function() {
            scope.numShowGroups = 0;
            scope.viewLimit = Math.min(ITEMS_TO_SHOW_INITIALLY, scope.nodes.length);
        };

        scope.selectNode = function(nodeId, $event) {
            if(scope.panelMode == 'selection') {
                parCtrl.openNodeBrowserInSelMode();
            }
            selectNodes([nodeId], $event);
        };

        scope.hoverNode = function(nodeId) {
            hoverNodes([nodeId]);
        };

        scope.unHoverNode = function(nodeId) {
            unHoverNodes([nodeId]);
        };

        scope.selectGroup = function(group) {
            selectNodes(_.map(group.nodes, 'id'));
        };

        scope.hoverGroup = function(group) {
            hoverNodes(_.map(group.nodes, 'id'));
        };

        scope.unHoverGroup = function(group) {
            unHoverNodes(_.map(group.nodes, 'id'));
        };

        scope.filterNode = function(node) {
            if (!scope.nodeSearchQuery) { return true; }
            var regex = new RegExp(scope.nodeSearchQuery, 'gi');
            return node.attr[scope.labelAttr].match(regex);
        };

        scope.getNodeTooltipHtml = function(node) {
            var html = '<ul class="list-unstyled">';
            var attrTitle = _.get(_.find(scope.sortTypes, 'id', scope.sortInfo.sortType), 'title', '');
            var attrVal = node.attr[scope.sortInfo.sortType];
            if (_.isNumber(attrVal) && !Number.isInteger(attrVal)) { attrVal = attrVal.toFixed(2); }
            html += '<li><b>Name: ' + ':</b> ' + node.attr[scope.labelAttr] + '</li>';
            // Don't duplicate 'Name' as it is always displayed as first property in tooltip info
            if (attrTitle !== 'Name') {
                html += '<li><b>' + _.startCase(attrTitle) + ':</b> ' + attrVal + '</li>';
            }
            html += '</ul>';
            return html;
        };

        scope.getNodeColor = function(node) {
            if (node && node.attr && node.attr.Cluster) {
                return memoizedGetFunctionColor(node.attr.Cluster);
            }
        }

        scope.getGroupColor = function(groupName) {
            return memoizedGetFunctionColor(groupName);
        }

        function getFunctionColor(cluster) {
            return d3.rgb(scope.layout.scalers.color(cluster)).toString();
        }

        function selectNodes(nodeIds, ev) {
            parCtrl.replaceSelection();
            graphHoverService.clearHovers(ev);
            graphSelectionService.selectByIds(nodeIds ,1);
            FilterPanelService.rememberSelection(false);
        }

        function hoverNodes(nodeIds) {
            parCtrl.persistSelection();
            graphHoverService.hoverByIds(nodeIds, 1, false);
        }

        function unHoverNodes(nodeIds) {
            graphHoverService.unhoverByIds(nodeIds);
        }
    }



    /*************************************
    ************ Local Functions *********
    **************************************/


    return dirDefn;
}
]);
