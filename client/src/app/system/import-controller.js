'use strict';

app.controller('ImportModalCtrl', function($scope, $rootScope, $modalInstance, $timeout, DefaultsSrvc, BillSrvc, SearchSrvc) {

    function init() {
        $scope.importData = {
            defaults: {},
            bills: []
        };
        $scope.processed = 0;
        $scope.total = 1;
        $scope.notReady = true;
    }
    init();

    $scope.load = function(fileContent) {
        init();
        var json = JSON.parse(fileContent);
        $scope.importData.defaults = json.defaults;
        $scope.importData.bills = json.bills;
        $scope.total = $scope.importData.bills.length + 1;

        $scope.notReady = false;
    };

    $scope.process = function() {
        $scope.notReady = true;

        DefaultsSrvc.update($scope.importData.defaults).then(function(response) {
            $scope.processed++;

            $rootScope.$emit('notify', {
                'type': response.type,
                'msg': response.msg
            });

            // recursive function call
            updateBills();
        });

    };

    function updateBills() {

        if ($scope.processed === $scope.total) {
            SearchSrvc.dataImport(true).then(function(data) {

                $rootScope.$emit('notify', {
                    'type': data.type,
                    'msg': data.msg
                });
            });
        } else {
            var bill = $scope.importData.bills[$scope.processed - 1];

            // old ids cannot be imported
            bill.id = null;
            BillSrvc.add(bill).then(function(response) {
                $scope.processed++;

                $rootScope.$emit('notify', {
                    'type': response.type,
                    'msg': response.msg
                });

                $timeout(function() {
                    updateBills();
                }, 50);
            });
        }
    }

    $scope.cancel = function() {
        $modalInstance.dismiss();
    };

});
