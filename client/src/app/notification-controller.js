'use strict';

app.controller('NotificationCtrl', function($scope, $rootScope, toaster) {

    $scope.notifications = [];

    $rootScope.$on('notify', function(event, notification) {
        toaster.pop(notification.type, notification.msg);

        notification.time = new Date();
        $scope.notifications.unshift(notification);
    });

    $scope.clear = function() {
        $scope.notifications = [];
    };

    $scope.count = function() {
        return $scope.notifications.length;
    };

    $scope.getType = function(type) {
        if (type === 'error') {
            return 'danger';
        } else {
            return type;
        }
    };

    $scope.timeSince = function(date) {

        var seconds = Math.floor((new Date() - date) / 1000);

        var interval = Math.floor(seconds / 31536000);

        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + ' hours ago';
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + ' minutes ago';
        }
        return Math.floor(seconds) + ' seconds ago';
    };

});
