'use strict';

app.controller('DeleteModalCtrl', function($scope, $modalInstance, item, details, showUpdate) {

  $scope.item = item;
  $scope.details = details;
  $scope.showUpdate = showUpdate;

  $scope.ok = function() {
    $modalInstance.close($scope.item);
  };

  $scope.cancel = function() {
    $modalInstance.dismiss();
  };

});