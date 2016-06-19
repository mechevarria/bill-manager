'use strict';

app.controller('DeleteModalCtrl', function($scope, $uibModalInstance, item, details, showUpdate) {

  $scope.item = item;
  $scope.details = details;
  $scope.showUpdate = showUpdate;

  $scope.ok = function() {
    $uibModalInstance.close($scope.item);
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss();
  };

});
