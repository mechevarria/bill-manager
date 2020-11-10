'use strict';

app.controller('BillCtrl', function($scope, $uibModal, $rootScope, BillSrvc, DefaultsSrvc, SearchSrvc) {

    function loadDefaults() {
        $scope.defaults = {};

        DefaultsSrvc.get().then(function(data) {
            $scope.defaults = data;
        });

    }
    function load() {
        loadDefaults();

        // defaults
        var tableState = {
            pagination: {
                start: 0,
                number: 10
            },
            sort : {
                predicate: 'billDate',
                reverse : true
            }
        };

        $scope.updateTable(tableState);

    }

    $scope.updateTable = function(tableState) {
        var pagination = tableState.pagination;

        var start = pagination.start;
        var number = pagination.number;

        var column = 'billDate';

        var order = 'desc';

        BillSrvc.getBills(start, number, column, order).then(function(result) {
            $scope.bills = result.bills;
            tableState.pagination.numberOfPages = result.numberOfPages;
        });
    };

    $scope.$on('load', function() {
        load();
    });

    $scope.$on('hide', function(event, name) {
        $scope[name] = true;
        $scope.hideList = false;
    });

    $scope.doConfirm = function(bill) {
        var modalInstance = $uibModal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return angular.copy(bill);
                },
                details: function() {
                    return bill.month + ' - ' + bill.year;
                },
                showUpdate: function() {
                    return false;
                }
            }
        });

        modalInstance.result.then(function(toDelete) {
            var promise = BillSrvc.delete(toDelete.id);

            promise.then(function(response) {
                $rootScope.$emit('notify', {
                    'type': response.type,
                    'msg': response.msg
                });

                // index changes
                SearchSrvc.dataImport().then(function(data) {
                    if (data.type === 'error') {
                        $rootScope.$emit('notify', {
                            'type': 'error',
                            'msg': data.msg
                        });
                    }
                });

                load();
            });
        });
    };

    $scope.$on('edit', function(event, id) {
        $scope.doEdit(id);
    });

    $scope.doEdit = function(id) {
        var promise = BillSrvc.get(id);

        promise.then(function(bill) {
            if (bill === null) {
                $rootScope.$emit('notify', {
                    'type': 'error',
                    'msg': 'Failed to get bill with id=' + id
                });
            } else {
                $scope.$broadcast('toEdit', bill);
                $scope.hideList = true;
                $scope.hideEdit = false;
            }

        });
    };

    $scope.doAdd = function() {
        $scope.toAdd = {};
        $scope.hideList = true;
        $scope.hideAdd = false;
    };

    $scope.getColor = function(name) {
        var color = '';
        angular.forEach($scope.defaults.owners, function(owner) {
            if (owner.name == name) {
                color = owner.color;
            }
        });
        return color;
    };

    loadDefaults();

    $scope.hideList = false;
    $scope.hideAdd = true;
    $scope.hideEdit = true;
    $scope.hideConfirm = true;
    $scope.hideDetails = true;
});
