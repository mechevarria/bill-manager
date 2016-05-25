'use strict';

app.controller('DetailsCtrl', function ($scope, $modal, $rootScope, CsvSrvc) {

  $scope.$on('editDetail', function (event, details) {
    $scope.details = details;
    $scope.displayedDetails = [].concat($scope.details);

    $scope.paidList = angular.copy($scope.defaults.owners);
    $scope.paidList.unshift({
      'name': '',
      'label': '',
      'color': ''
    });

  });

  $scope.addDetail = function () {
    $scope.details.unshift({
      'date': '',
      'reference': '',
      'type': '',
      'description': '',
      'amount': 0,
      'personal': ''
    });
  };

  $scope.removeAll = function () {
    var modalInstance = $modal.open({
      templateUrl: 'app/delete-modal/delete-modal.tpl.html',
      controller: 'DeleteModalCtrl',
      resolve: {
        item: function () {
          return {};
        },
        details: function () {
          return 'all details from this expense';
        },
        showUpdate: function () {
          return true;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.details.length = 0;
      $scope.update();

      $rootScope.$emit('notify', {
        'type': 'info',
        'msg': 'Details cleared'
      });
    });

  };

  $scope.cancel = function () {
    $scope.hideRemove = true;
  };

  $scope.deleteDetail = function (detail) {
    var modalInstance = $modal.open({
      templateUrl: 'app/delete-modal/delete-modal.tpl.html',
      controller: 'DeleteModalCtrl',
      resolve: {
        item: function () {
          return detail;
        },
        details: function () {
          return '[date: ' + detail.date + '][description: ' + detail.description + '][amount: $' + detail.amount + ']';
        },
        showUpdate: function () {
          return true;
        }
      }
    });

    modalInstance.result.then(function (detail) {
      var index = $scope.details.indexOf(detail);
      if (index !== -1) {
        $scope.details.splice(index, 1);
      }
      $rootScope.$emit('notify', {
        'type': 'info',
        'msg': 'Detail removed'
      });
      $scope.update();
    });

  };

  $scope.hideDetail = function () {
    $scope.$emit('hideDetail');
  };

  function getAmount(value) {
    if (!angular.isUndefined(value)) {
      return Number(value) * -1;
    }
  }

  function isValidDetail(detail) {
    if (angular.isUndefined(detail.amount) || angular.isUndefined(detail.description)) {
      return false;
    }

    if (detail.description == 'ONLINE PAYMENT - THANK YOU') {
      return false;
    }

    return true;
  }

  $scope.doImport = function ($fileContent) {
    var array = CsvSrvc.toArray($fileContent);

    angular.forEach(array, function (line) {
      // does this line start with a date?
      if (moment(line[0], "MM/DD/YYYY").isValid()) {

        // the amazon credit card detail starts with 2 dates
        if (moment(line[1], "MM/DD/YYYY").isValid()) {
          var description = '';
          var type = '';

          var split = ' WA ';
          if(line[4].indexOf(split) > 0) {
            description = line[4].substring(line[4].indexOf(split) + split.length, line[4].length);
            type = line[4].substring(0, line[4].indexOf(split) + split.length);
          } else {
            description = line[4];
          }


          var detail = {
            'date': line[1],
            'reference': line[2],
            'amount': getAmount(line[3]),
            'description': description,
            'type': type,
            'personal': line[6]
          };

        }
        // this case handles american express
        else {

          var detail = {
            'date': line[0],
            'reference': line[1],
            'amount': getAmount(line[2]),
            'description': line[3],
            'type': line[4],
            'personal': line[5]
          };
        }

        if (isValidDetail(detail)) {
          $scope.details.push(detail);
        }
      }

    });

    $scope.update();

  };

  $scope.hideRemove = true;
  $scope.sizes = [10, 50, 100];
  $scope.pageSize = $scope.sizes[2];
});
