'use strict';

app.controller('HeaderCtrl', function($scope, $location) {

    $scope.isActive = function(viewLocation) {
        return viewLocation === $location.path();
    };
    
});