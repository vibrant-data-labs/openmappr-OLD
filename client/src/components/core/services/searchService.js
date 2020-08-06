/**
* Used to search nodes on whole dataset or some selected attributes
*/
angular.module('common')
.service('searchService', ['$q', '$http', 'dataGraph', 'cfpLoadingBar',
function($q, $http, dataGraph, cfpLoadingBar) {
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

        var start = performance.now();
        cfpLoadingBar.start();

        // FUZZY SORT
        var allNodes = dataGraph.getAllNodes();

        var hits = fuzzysort.go(text, allNodes, {
            keys: filterAttrIds,
            threshold: -100,
            nodes: true,
            allowTypo: true
        });
        console.log('fuzzysearch !', performance.now() - start, hits);

        // NAIVE SEARCH
        // var idx = 0;
        // var hits = _.reduce(allNodes, function(acc, cv) {
        //     cfpLoadingBar.set(idx / allNodes.length);
        //     var hitsData = _.reduce(Object.keys(cv.attr), function(attrAcc, attrCv) {
        //         if (cv.attr[attrCv] && _.contains(cv.attr[attrCv].toString().toLowerCase(), text.toLowerCase())) {
        //             attrAcc[attrCv] = cv.attr[attrCv];
        //         }

        //         return attrAcc;
        //     }, {});

        //     idx++;
        //     if (!Object.keys(hitsData).length) return acc;

        //     acc.push({
        //         _source: {
        //             id: cv.id,
        //         },
        //         highlight: {
        //             ...hitsData,
        //         }
        //     });

        //     return acc;
        // }, []);

        // console.log('search finished: ', performance.now() - start)
        cfpLoadingBar.complete();
        return _.map(hits, function(n) {
            var highlights = _.reduce(n, function(acc, cv, i) {
                if (!cv) return acc;
                if (cv.score < -100) return acc;
                acc.push({
                    attrName: filterAttrIds[i],
                    text: fuzzysort.highlight(cv, '<i>', '</i>')
                });

                return acc;
            }, {});

            return {
                _source: {
                    id: n.obj.id
                },
                highlights: highlights
            }
        });

        // return $http.post('/api/elasticsearch/search_nodes', {
        //     dataSetId : dataSetRef,
        //     query : text,
        //     filterAttrIds: filterAttrIds
        // }).then(
        //     function(data) {
        //         console.log("[searchService] Got data : %O",data);
        //         var hits = data.data.hits || [];
        //         var ids = _.map(hits, function(sn) {return sn._source.id;});
        //         if(ids && ids.length > 0) {
        //             // graphSelectionService.selectByDataPointIds(ids,0);
        //             return hits;
        //         }
        //         else {
        //             console.log("[searchService] Found nothing");
        //             // graphSelectionService.clearSelections(true);
        //             return $q.reject('noMatch');
        //         }
        //     },
        //     function(error) {
        //         console.log("[searchService] Got error: %O",error);
        //         return $q.reject('searchFailed');
        //     }
        // );

    }

}
]);