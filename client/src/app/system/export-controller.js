'use strict';

app.controller('ExportModalCtrl', function($scope, $modalInstance, $timeout, DefaultsSrvc, BillSrvc) {
    function init() {
        $scope.total = 1;
        $scope.processed = 0;
    }
    init();

    $scope.prepare = function() {
        init();

        BillSrvc.getIds().then(function(data) {
            var idList = data;

            // add one to total for the defaults
            $scope.total = idList.length + 1;
            getExportData(idList);
        });

    };

    function getExportData(idList) {

        $scope.exportData = {
            defaults: {

            },
            bills: []
        };

        DefaultsSrvc.get().then(function(data) {
            $scope.exportData.defaults = data;
            $scope.processed++;

            exportBills(idList);
        });
    }

    function exportBills(idList) {
        if( $scope.notFinished() ) {
            var id = idList[ $scope.processed - 1 ];

            BillSrvc.get(id).then(function(data) {
                $scope.exportData.bills.push(data);
                $scope.processed++;

                $timeout(function() {
                    exportBills(idList);
                }, 50);
            });
        }
    }

    $scope.isFinished = function() {
        return $scope.processed === $scope.total;
    };

    $scope.notFinished = function() {
        return $scope.processed != $scope.total;
    };

    $scope.download = function() {

        var blob = new Blob([angular.toJson($scope.exportData)], {
            type: 'application/json;charset=utf-8;'
        });
        $scope.url = (window.URL || window.webkitURL).createObjectURL(blob);

        $modalInstance.close($scope.total);
    };

    $scope.cancel = function() {
        $modalInstance.dismiss();
    };

});
