'use strict';

app.factory('DefaultsSrvc', function($q, $http) {
    var resource = '/api/defaults/';
    var factory = {};

    factory.update = function(defaults) {
        var deferred = $q.defer();
        var response = {};

        $http.post(resource + 'save.json', defaults).
        success(function(data) {
            response = {
                data: data,
                type: 'success',
                msg: 'Defaults successfully updated'
            };

            deferred.resolve(response);
        }).
        error(function(data) {
        	response = {
                data: data,
                type: 'danger',
                msg: 'Defaults failed to update'
            };

            deferred.resolve(response);
        });

        return deferred.promise;
    };
    factory.get = function() {
        var deferred = $q.defer();

        $http.get(resource + 'index.json').success(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;

    };
    return factory;
});
