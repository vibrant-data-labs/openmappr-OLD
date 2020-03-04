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
            attr: '='
        },
        template: '<dir-sort-menu align-to-right="true" sort-types="sortTypes" sort-config="attr.sortOps"></dir-sort-menu>',
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
