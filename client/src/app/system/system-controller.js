'use strict';

app.controller('SystemCtrl', function($scope, $rootScope, $modal, DefaultsSrvc, DeleteSrvc) {

    function loadDefaults() {
        DefaultsSrvc.get().then(function(defaults) {
            $scope.toEdit = defaults;
        });
    }
    loadDefaults();

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.alerts = [];

    $scope.getColor = function(name) {
        var color = '';
        angular.forEach($scope.toEdit.owners, function(owner) {
            if (owner.name == name) {
                color = owner.color;
            }
        });
        return color;
    };

    $scope.colors = [{
        label: 'Grey',
        value: 'active'
    }, {
        label: 'Green',
        value: 'success'
    }, {
        label: 'Blue',
        value: 'info'
    }, {
        label: 'Orange',
        value: 'warning'
    }, {
        label: 'Red',
        value: 'danger'
    }];

    $scope.doUpdate = function(isValid, defaults) {
        if (isValid) {
            var promise = DefaultsSrvc.update(defaults);

            promise.then(function(response) {
                if (response.type === 'success') {
                    $scope.toEdit = response.data;
                }

                $rootScope.$emit('notify', {
                    'type': response.type,
                    'msg': response.msg
                });
            });

        }
    };

    $scope.deleteExpense = function(expense) {
        var modalInstance = $modal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return expense;
                },
                details: function() {
                    return '[name: ' + expense.name + '][amount: $' + expense.amount + '][paid by: ' + expense.paid + ']';
                },
                showUpdate: function() {
                    return true;
                }
            }
        });

        modalInstance.result.then(function(expense) {
            var index = $scope.toEdit.expenses.indexOf(expense);
            if (index !== -1) {
                $scope.toEdit.expenses.splice(index, 1);
                $rootScope.$emit('notify', {
                    'type': 'info',
                    'msg': 'Expense removed'
                });
            }
        });

    };

    $scope.deleteIncome = function(income) {
        var modalInstance = $modal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return income;
                },
                details: function() {
                    return '[owner: ' + income.owner + '][description: ' + income.description + '][amount: $' + income.amount + ']';
                },
                showUpdate: function() {
                    return true;
                }
            }
        });

        modalInstance.result.then(function(income) {
            var index = $scope.toEdit.incomes.indexOf(income);
            if (index !== -1) {
                $scope.toEdit.incomes.splice(index, 1);
                $rootScope.$emit('notify', {
                    'type': 'info',
                    'msg': 'Income removed'
                });
            }
        });

    };

    $scope.addIncome = function() {
        $scope.toEdit.incomes.unshift({
            'owner': $scope.toEdit.owners[0].name,
            'description': '',
            'amount': 0
        });
    };

    $scope.addExpense = function() {
        $scope.toEdit.expenses.unshift({
            'name': '',
            'amount': 0,
            'paid': 'owner1',
            'hasDetails': false,
            'details': []
        });
    };

    $scope.getIcon = function(hasDetails) {
        if (hasDetails) {
            return 'fa fa-circle';
        } else {
            return 'fa fa-circle-o';
        }

    };

    $scope.confirmErase = function() {
        var modalInstance = $modal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return {};
                },
                details: function() {
                    return 'all data in the system';
                },
                showUpdate: function() {
                    return false;
                }
            }
        });

        modalInstance.result.then(function() {

            // reset defaults
            $scope.toEdit.incomes = [];
            $scope.toEdit.expenses = [];
            $scope.toEdit.owners = [{
                name: 'owner1',
                label: 'owner1',
                color: 'info'
            }, {
                name: 'owner2',
                label: 'owner2',
                color: 'danger'
            }];

            $scope.doUpdate(true, $scope.toEdit);

            DeleteSrvc.delete();
        });
    };

    $scope.doExport = function() {
        var modalInstance = $modal.open({
            templateUrl: 'app/system/export-modal.tpl.html',
            controller: 'ExportModalCtrl'
        });

        modalInstance.result.then(function(count) {
            $rootScope.$emit('notify', {
                'type': 'info',
                'msg': 'Exported ' + count + ' records'
            });

        });
    };

    $scope.doImport = function() {
        $modal.open({
            templateUrl: 'app/system/import-modal.tpl.html',
            controller: 'ImportModalCtrl'
        });
    };
});
