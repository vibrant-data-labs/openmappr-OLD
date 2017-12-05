angular.module('common')
.directive('dirNeighborClusters', ['graphSelectionService', 'FilterPanelService', 'graphHoverService',
function(graphSelectionService, FilterPanelService, graphHoverService) {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'AE',
        templateUrl: '#{server_prefix}#{view_path}/components/project/panels/right_panel/info_panel/neighborClusters.html',
        scope: {
            selGroup: '=',
            nodeGroups: '='
        },
        link: postLinkFn
    };

    /*************************************
    ************ Local Data **************
    **************************************/


    /*************************************
    ******** Controller Function *********
    **************************************/


    /*************************************
    ******** Post Link Function *********
    **************************************/
    function postLinkFn(scope) {
        scope.$watch('selGroup', function(group) {
            scope.neighborGroups = _.map(group.neighborGroups, function(nbrGrp) {
                return _.find(scope.nodeGroups, 'name', nbrGrp);
            });
        });

        scope.selectGroup = function(group) {
            graphSelectionService.selectByIds(group.nodeIds);
            FilterPanelService.rememberSelection(false);
        };

        scope.hoverGroup = function(group, $event) {
            graphHoverService.hoverByIds(group.nodeIds, $event, false);
        };

        scope.unHoverGroup = function(group, $event) {
            graphHoverService.unhoverByIds(group.nodeIds, $event, false);
        };
    }



    /*************************************
    ************ Local Functions *********
    **************************************/



    return dirDefn;
}
]);