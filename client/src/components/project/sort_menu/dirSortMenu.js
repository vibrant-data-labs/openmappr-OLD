// Receives
// 1) list of possible sort options
// 2) sortConfig object which will be modified by this directive acc. to user interaction.
// Thus, parent can listen to changes to config and render lists accordingly.

// Sort orders are common => ascending & descending
angular.module('common')
.directive('dirSortMenu', [function() {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'E',
        scope: {
            sortTypes: '=', // List of Sort types objects eg. {id: 'alphabetical', title: 'Alphabetical'}
            sortConfig: '=' // Model for sort => {sortType: 'alphabetical', sortOrder: 'desc'}
        },
        templateUrl: '#{server_prefix}#{view_path}/components/project/sort_menu/sortMenu.html',
        link: postLinkFn
    };

    /*************************************
    ************ Local Data **************
    **************************************/

    var sortOrders = [
        {
            id: 'asc',
            title: 'Ascending'
        },
        {
            id: 'desc',
            title: 'Descending'
        }
    ];


    /*************************************
    ******** Controller Function *********
    **************************************/


    /*************************************
    ******** Post Link Function *********
    **************************************/
    function postLinkFn(scope) {

        scope.ui = {
            menuOpen: false
        };

        scope.sortOrders = sortOrders;

        scope.setSortOrder = function setSortOrder(sortOrder, $event) {
            var newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            scope.sortConfig = scope.sortConfig || {};
            scope.sortConfig.sortOrder = newSortOrder;
            $event.stopPropagation();
        }
    
        scope.setSortType = function setSortType(sortType, $event) {
            scope.sortConfig = scope.sortConfig || {};
            scope.sortConfig.sortType = sortType;
            $event.stopPropagation();
        }
    }



    /*************************************
    ************ Local Functions *********
    **************************************/


    return dirDefn;
}
]);
