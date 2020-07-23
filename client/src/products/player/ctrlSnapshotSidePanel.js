angular.module('player')
.controller('SnapshotSidePanelCtrl',['$q', '$timeout', '$scope', '$rootScope', 'snapshotService', 'BROADCAST_MESSAGES',
function ($q, $timeout, $scope, $rootScope, snapshotService, BROADCAST_MESSAGES) {
    'use strict';

    $scope.activeSnapId = '';

    // Snaps object with methods
    $scope.snapshots = null;
    $scope.currentSnap = null;

    $scope.setSnapActive = function(snap) {
        $scope.snapInfo.curSnapInd = _.findIndex($scope.snapshots, {id: snap.id});
        if(!snap) {
            console.warn('no snapshot to load! given Id:' + snap.id);
        }

        // if(!snap.descr) {
        //     $scope.isDescriptionClosed = true;
        // }

        $scope.snapInfo.oldSnapId = $scope.snapInfo.activeSnap.id;
        //set up class for animating in snap desc
        var oldSnapInd = _.findIndex($scope.snapshots, {id: $scope.snapInfo.oldSnapId});
        var fromBottom = $scope.snapInfo.curSnapInd > oldSnapInd;
        $scope.snapDescClass = fromBottom ? 'animate-from-bottom' : 'animate-from-top' ;
        $timeout(function() {
            $scope.snapInfo.activeSnap = snap;
            switch (snap.type) {
            case 'network':
            default:
                $scope.switchSnapshot(snap.id);
            }

            var snapInd = _.findIndex($scope.snapshots, {'id': $scope.snapInfo.activeSnap.id});
            $scope.currentTime = $scope.settings.snapDuration*snapInd*1000;

            //set old snap id
            $scope.snapInfo.curSnapId = $scope.snapInfo.activeSnap.id;
        });


    }

    $scope.$on(BROADCAST_MESSAGES.dataGraph.loaded, initPanel); // Init snap bar

    initPanel();

    function initPanel() {
        console.log('initPanel', $scope.player);
        $scope.snapshots = $scope.player.snapshots;
        if($scope.snapshots.length > 0) {
            $scope.currentSnap = $scope.snapshots[0];
        }
        // snapshotService.getSnapshots()
        // .then(function(snaps) {
        //     if(!_.isArray(snaps)) {
        //         throw new Error('Array expected for snapshots');
        //     }
        //     $scope.snapshots = snaps;
        //     if(snaps.length > 0) {
        //         $scope.currentSnap = snaps[0];
        //     }
        // });
    }
}
]);