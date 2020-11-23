'use strict';

app.controller('EditCtrl', function($scope, $uibModal, $rootScope, localStorageService, BillSrvc, SearchSrvc) {

    function getIncome(name, incomes) {
        var total = 0;

        angular.forEach(incomes, function(income) {
            if (income.owner == name) {
                total += income.amount;
            }
        });

        return total;
    }

    function getPersonal(name, expenses) {
        var total = 0;
        var detailTotal = 0;

        angular.forEach(expenses, function(expense) {
            detailTotal = 0;
            if (expense.hasDetails) {
                angular.forEach(expense.details, function(detail) {


                    if (detail.personal == name) {
                        total += detail.amount;
                    }
                    detailTotal += detail.amount;
                });
                expense.amount = Math.round(detailTotal * 100) / 100;
            }
        });

        return Math.round(total * 100) / 100;
    }

    function getTotalExpense(expenses) {
        var total = 0;

        angular.forEach(expenses, function(expense) {
            total += expense.amount;
        });
        return total;
    }

    function getPercentages(owner1Income, owner2Income) {
        var total = owner1Income + owner2Income;

        var percent = {
            owner1: (owner1Income / total).toFixed(2),
            owner2: (owner2Income / total).toFixed(2)
        };

        return percent;
    }

    function getIncomeDiff(percent) {

        var owner1 = $scope.defaults.owners[0].label;
        var owner2 = $scope.defaults.owners[1].label;

        var owner1Percent = percent.owner1 * 100;
        var owner2Percent = percent.owner2 * 100;

        var msg = owner1 + ' has ' + owner1Percent + '% and ' + owner2 + ' has ' + owner2Percent + '% of monthly income'

        return msg
    }

    function setShare(percentages, totalShared) {
        $scope.toEdit.owner1Shared = percentages.owner1 * totalShared;
        $scope.toEdit.owner2Shared = percentages.owner2 * totalShared;
    }

    function getPaid(owner) {
        var total = 0;
        angular.forEach($scope.toEdit.expenses, function(expense) {
            if (expense.paid == owner) {
                total += expense.amount;
            }
        });
        return total;
    }

    function getSettlement(owner1, owner2) {
        var amount = 0;
        var positive = '';
        var negative = '';

        if (owner1 < owner2) {
            amount = owner2;
            negative = $scope.defaults.owners[0].label;
            positive = $scope.defaults.owners[1].label;

        } else {
            amount = owner1;
            negative = $scope.defaults.owners[1].label;
            positive = $scope.defaults.owners[0].label;
        }

        amount = Math.round(amount * 100) / 100;

        return positive + ' owes ' + negative + ' $' + amount;
    }

    // this function does too much.  Needs to be re-written
    $scope.update = function() {
        $scope.toEdit.owner1Income = getIncome($scope.defaults.owners[0].name, $scope.toEdit.incomes);
        $scope.toEdit.owner2Income = getIncome($scope.defaults.owners[1].name, $scope.toEdit.incomes);
        $scope.toEdit.totalIncome = $scope.toEdit.owner1Income + $scope.toEdit.owner2Income;

        $scope.toEdit.owner1Personal = getPersonal($scope.defaults.owners[0].name, $scope.toEdit.expenses);
        $scope.toEdit.owner2Personal = getPersonal($scope.defaults.owners[1].name, $scope.toEdit.expenses);
        $scope.toEdit.totalPersonal = $scope.toEdit.owner1Personal + $scope.toEdit.owner2Personal;

        var percentages = getPercentages($scope.toEdit.owner1Income, $scope.toEdit.owner2Income);

        $scope.incomeDiff = getIncomeDiff(percentages);
        $scope.toEdit.totalExpense = getTotalExpense($scope.toEdit.expenses);
        $scope.toEdit.totalShared = $scope.toEdit.totalExpense - $scope.toEdit.totalPersonal;
        setShare(percentages, $scope.toEdit.totalShared);

        $scope.toEdit.owner1Total = $scope.toEdit.owner1Income - $scope.toEdit.owner1Personal - $scope.toEdit.owner1Shared;
        $scope.toEdit.owner2Total = $scope.toEdit.owner2Income - $scope.toEdit.owner2Personal - $scope.toEdit.owner2Shared;
        $scope.toEdit.total = $scope.toEdit.owner1Total + $scope.toEdit.owner2Total;

        $scope.toEdit.owner1Paid = getPaid($scope.defaults.owners[0].name);
        $scope.toEdit.owner2Paid = getPaid($scope.defaults.owners[1].name);

        $scope.toEdit.owner1Owe = $scope.toEdit.owner1Personal + $scope.toEdit.owner1Shared - $scope.toEdit.owner1Paid;
        $scope.toEdit.owner1Owe = Math.round($scope.toEdit.owner1Owe * 100) / 100;

        $scope.toEdit.owner2Owe = $scope.toEdit.owner2Personal + $scope.toEdit.owner2Shared - $scope.toEdit.owner2Paid;
        $scope.toEdit.owner2Owe = Math.round($scope.toEdit.owner2Owe * 100) / 100;

        $scope.toEdit.settlement = getSettlement($scope.toEdit.owner1Owe, $scope.toEdit.owner2Owe);

    };

    $scope.doSave = function(isValid, bill) {
        if (isValid) {
            var promise = BillSrvc.update(bill);

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

                $scope.$emit('load');
                $scope.doCancel();
            });
        }

    };

    $scope.doCancel = function() {
        $scope.$emit('hide', 'hideEdit');
    };

    $scope.deleteExpense = function(expense) {
        var modalInstance = $uibModal.open({
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
            }
            $rootScope.$emit('notify', {
                'type': 'info',
                'msg': 'Expense removed'
            });
        });

    };

    $scope.deleteIncome = function(income) {
        var modalInstance = $uibModal.open({
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
            }
            $rootScope.$emit('notify', {
                'type': 'info',
                'msg': 'Income removed'
            });
        });
    };

    $scope.addIncome = function() {
        $scope.toEdit.incomes.unshift({
            'owner': $scope.defaults.owners[0].name,
            'description': '',
            'amount': 0
        });
    };

    $scope.addExpense = function() {
        $scope.toEdit.expenses.unshift({
            'name': '',
            'amount': 0,
            'paid': $scope.defaults.owners[0].name,
            'hasDetails': false
        });
    };

    $scope.addDetails = function(expense) {
        expense.hasDetails = true;
        expense.details = [];
    };

    $scope.editDetails = function(details) {
        $scope.hideDetails = false;
        $scope.$broadcast('editDetail', details);
    };

    $scope.$on('removeDetails', function() {

    });

    $scope.$on('hideDetail', function() {
        $scope.hideDetails = true;
    });

    $scope.$on('toEdit', function(event, bill) {
        $scope.toEdit = bill;
        $scope.hideDetails = true;
        $scope.displayedExpenses = [].concat($scope.toEdit.expenses);

        $scope.update();

    });

});
