'use strict';

app.controller('DetailsCtrl', function($scope, $modal, $rootScope, CsvSrvc) {

    $scope.$on('editDetail', function(event, details) {
        $scope.details = details;
        $scope.displayedDetails = [].concat($scope.details);

        $scope.paidList = angular.copy($scope.defaults.owners);
        $scope.paidList.unshift({
            'name': '',
            'label': '',
            'color': ''
        });

    });

    $scope.addDetail = function() {
        $scope.details.unshift({
            'date': '',
            'reference': '',
            'type': '',
            'description': '',
            'amount': 0,
            'personal': ''
        });
    };

    $scope.removeAll = function() {
        var modalInstance = $modal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return {};
                },
                details: function() {
                    return 'all details from this expense';
                },
                showUpdate: function() {
                    return true;
                }
            }
        });

        modalInstance.result.then(function() {
            $scope.details.length = 0;
            $scope.update();

            $rootScope.$emit('notify', {
                'type': 'info',
                'msg': 'Details cleared'
            });
        });

    };

    $scope.cancel = function() {
        $scope.hideRemove = true;
    };

    $scope.deleteDetail = function(detail) {
        var modalInstance = $modal.open({
            templateUrl: 'app/delete-modal/delete-modal.tpl.html',
            controller: 'DeleteModalCtrl',
            resolve: {
                item: function() {
                    return detail;
                },
                details: function() {
                    return '[date: ' + detail.date + '][description: ' + detail.description + '][amount: $' + detail.amount + ']';
                },
                showUpdate: function() {
                    return true;
                }
            }
        });

        modalInstance.result.then(function(detail) {
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

    $scope.hideDetail = function() {
        $scope.$emit('hideDetail');
    };

    function getAmount(value) {
        if (!angular.isUndefined(value)) {
            return Number(value) * -1;
        }
    }

    function isValidDetail(detail) {
        if (angular.isUndefined(detail.date) || angular.isUndefined(detail.amount) || angular.isUndefined(detail.description)) {
            return false;
        }

        if (detail.description == 'ONLINE PAYMENT - THANK YOU') {
            return false;
        }

        return true;
    }

    $scope.doImport = function($fileContent) {
        var array = CsvSrvc.toArray($fileContent);

        angular.forEach(array, function(line) {
            var detail = {
                'date': line[0],
                'reference': line[1],
                'amount': getAmount(line[2]),
                'description': line[3],
                'type': line[4],
                'personal': line[5]
            };

            if (isValidDetail(detail)) {
                $scope.details.push(detail);
            }

        });

        $scope.update();

    };

    $scope.hideRemove = true;
    $scope.sizes = [10,50,100];
    $scope.pageSize=$scope.sizes[2];
});
