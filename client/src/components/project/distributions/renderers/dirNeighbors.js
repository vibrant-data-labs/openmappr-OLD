angular.module('common')
.directive('dirNeighbors', ['$timeout', 'dataGraph', 'linkService',
function ($timeout, dataGraph, linkService) {
    'use strict';

    /*************************************
    ******** Directive description *******
    **************************************/
    var dirDefn = {
        restrict: 'EA',
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
    function postLinkFn(scope, element, attrs) {
        var links, hasLinks, incomingEdgesIndex, outgoingEdgesIndex;
        if (scope.focusNode) {

            var node = scope.focusNode;
            var dataset = dataGraph.getRawDataUnsafe();

            // link vars
            incomingEdgesIndex = dataset.edgeInIndex[node.id];
            outgoingEdgesIndex = dataset.edgeOutIndex[node.id];
            hasLinks = scope.hasLinks = _.size(incomingEdgesIndex) + _.size(outgoingEdgesIndex) > 0;

        }

        if (hasLinks || scope.extLinkedNodes) {
            if (scope.extLinkedNodes) {
                scope.hasLinks = true;
                links = constructNeighborInfo(scope.extLinkedNodes);
            } else {
                links = linkService.constructLinkInfo(node, incomingEdgesIndex, outgoingEdgesIndex, scope.mapprSettings.labelAttr, scope.mapprSettings.nodeImageAttr);
                scope.numLinks = links.length;
            }

            scope.links = links
            console.log('dirNeighbors', scope.links);
            
        } else {
            console.log('dirNeighbors', "Node has no links to other nodes");
        }

        //if coming from outside source and not actually linked
        function constructNeighborInfo(linkNodes) {
            var links = [];
            _.each(linkNodes, function (linkNode) {

                var linkNodeLabel = linkNode.attr[scope.mapprSettings.labelAttr] || linkNode.label || 'missing label';
                var linkNodeImage = linkNode.attr[scope.mapprSettings.nodeImageAttr] || linkNode.attr[scope.mapprSettings.nodePopImageAttr] || linkNode.image || '';
                links.push({
                    isIncoming: true,
                    isOutgoing: false,
                    sourceId: linkNode.id,
                    targetId: 0,
                    linkNode: linkNode,
                    linkNodeLabel: linkNodeLabel,
                    linkNodeImage: linkNodeImage,
                    edgeInfo: null,
                    id: null
                });
            });
            return links;
        }       
    }
    return dirDefn;
}
]);
