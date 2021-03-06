'use strict';

app.factory('DefaultsSrvc', function($q, $http) {
    var resource = '/api/defaults';
    var factory = {};

    factory.update = function(defaults) {
        var deferred = $q.defer();
        var response = {};

        $http.post(resource, defaults).
        success(function(data) {
            response = {
                data: data,
                type: 'success',
                msg: 'Defaults successfully updated'
            };

            deferred.resolve(response);
        }).
        error(function(msg) {
        	response = {
                type: 'error',
                msg: msg
            };

            deferred.resolve(response);
        });

        return deferred.promise;
    };
    factory.get = function() {
        var deferred = $q.defer();

        $http.get(resource).success(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;

    };
    return factory;
});
