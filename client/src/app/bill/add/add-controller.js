"use strict";

app.controller(
  "AddCtrl",
  function ($scope, $rootScope, $filter, toaster, BillSrvc) {
    // uib-datepicker options
    $scope.options = {
      datepickerMode: "month",
      minMode: "month",
    };

    $scope.doAdd = function (isValid, bill) {
      if (isValid) {
        bill.incomes = _.map($scope.defaults.incomes, function (income) {
          delete income.id;
          return income;
        });
        bill.expenses = _.map($scope.defaults.expenses, function (expense) {
          delete expense.id;
          return expense;
        });

        var promise = BillSrvc.add(bill);

        promise.then(function (response) {
          $rootScope.$emit("notify", {
            type: response.type,
            msg: response.msg,
          });
          $scope.$emit("load");
          $scope.doCancel();
          $scope.$emit("edit", response.data.id);
        });
      }
    };

    $scope.doCancel = function () {
      $scope.$emit("hide", "hideAdd");
    };

    $scope.setMonthYear = function (date) {
      $scope.toAdd.month = $filter("date")(date, "MMMM");
      $scope.toAdd.year = $filter("date")(date, "yyyy");
    };
  }
);
