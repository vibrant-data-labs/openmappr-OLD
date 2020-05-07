angular.module('common')
.directive('dirTagListSort', ['FilterPanelService', 'BROADCAST_MESSAGES',
function(FilterPanelService, BROADCAST_MESSAGES) {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'E',
        scope: {
            attr: '=',
            sortTypes: '=', // List of Sort types objects eg. {id: 'alphabetical', title: 'Alphabetical'}
            sortConfig: '=', // Model for sort => {sortType: 'alphabetical', sortOrder: 'desc'}
            alignToRight: '<'
        },
        template: '<button ng-click="setSortOrder($event)">sort</button>',
        link: postLinkFn
    };

    /*************************************
    ************ Local Data **************
    **************************************/
    var sortTypes = [
        {
            id: 'alphabetical',
            title: 'Alphabetical'
        },
        {
            id: 'frequency',
            title: 'Frequency'
        },
        {
            id: 'statistical',
            title: 'Relevance'
        }
    ];


    /*************************************
    ******** Controller Function *********
    **************************************/


    /*************************************
    ******** Post Link Function *********
    **************************************/
    function postLinkFn(scope, element, attrs) {
        var renderType = scope.attr.renderType;
        if (!_.contains(['tags', 'tag-cloud', 'categorylist'], renderType)) {
            throw new Error('Sort menu not supported for renderType', renderType);
        }

        scope.sortTypes = filterSortOpts(sortTypes, renderType);

        scope.$on(BROADCAST_MESSAGES.fp.initialSelection.changed, function() {
            scope.sortTypes = filterSortOpts(sortTypes, renderType);
        });

        scope.sortOrder = 'desc';
        scope.setSortOrder = function setSortOrder($event) {
            var newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            scope.sortConfig = scope.sortConfig || {};
            scope.sortConfig.sortOrder = newSortOrder;
            $event.stopPropagation();
        }
    }


    /*************************************
    ************ Local Functions *********
    **************************************/
    function filterSortOpts(sortOpts, renderType) {
        var initialSelection = FilterPanelService.getInitialSelection();
        var selectionMode = Array.isArray(initialSelection) && initialSelection.length > 0;

        return sortOpts.filter(function(opt) {
            if (renderType === 'categorylist' && opt.id === 'statistical') { return false; }
            if (!selectionMode && opt.id === 'statistical') { return false; }
            return true;
        });
    }

    return dirDefn;
}
]);
