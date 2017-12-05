/**
* Used to search nodes on whole dataset or some selected attributes
*/
angular.module('common')
.service('searchService', ['$q', '$http',
function($q, $http) {
    "use strict";


    /*************************************
    *************** API ******************
    **************************************/
    this.searchNodes = searchNodes;


    /*************************************
    ********* Local Data *****************
    **************************************/
    var logPrefix = '[searchService: ] ';


    /*************************************
    ********* Core Functions *************
    **************************************/

    function searchNodes(text, dataSetRef, filterAttrIds){
        if(!filterAttrIds) {
            console.warn(logPrefix + 'filter attr Ids not passed, using empty arr');
            filterAttrIds = [];
        }
        if(!_.isArray(filterAttrIds)) {
            throw new Error('Array expected for attr Ids');
        }

        return $http.post('/api/elasticsearch/search_nodes', {
            dataSetId : dataSetRef,
            query : text,
            filterAttrIds: filterAttrIds
        }).then(
            function(data) {
                console.log("[searchService] Got data : %O",data);
                var hits = data.data.hits || [];
                var ids = _.map(hits, function(sn) {return sn._source.id;});
                if(ids && ids.length > 0) {
                    // graphSelectionService.selectByDataPointIds(ids,0);
                    return hits;
                }
                else {
                    console.log("[searchService] Found nothing");
                    // graphSelectionService.clearSelections(true);
                    return $q.reject('noMatch');
                }
            },
            function(error) {
                console.log("[searchService] Got error: %O",error);
                return $q.reject('searchFailed');
            }
        );

    }

}
]);