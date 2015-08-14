'use strict';

app.factory('SearchSrvc', function($http, $q, $timezone) {
    var resource = '/solr/bills';
    var factory = {};

    factory.dataImport = function(clean) {
        // by default to a full import, not an update
        if(angular.isUndefined(clean)) {
          clean = true;
        }

        var config = {
            'command': 'full-import',
            'commit': true,
            'wt': 'json',
            'clean': clean,
            'TZ' : $timezone.getName()
        };

        var deferred = $q.defer();

        var url = resource + '/dataimport';

        $http({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj) {
                        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                    }
                    return str.join('&');
                },
                data: config
            })
            .success(function(data) {
                deferred.resolve({
                    'type': 'info',
                    'msg': data.statusMessages['Total Documents Processed'] + ' records updated for search'
                });
            })
            .error(function(data) {
                deferred.resolve({
                    'type': 'error',
                    'msg': data
                });
            });

        return deferred.promise;
    };

    factory.get = function(params, operator) {

        var query = '';
        angular.forEach(params, function(param) {
            query += operator + param.value + ' ';
        });

        var deferred = $q.defer();

        var url = resource + '/select';

        var config = {
            params: {
                'wt': 'json',
                'q': query,
                'rows': 2147483647,
                'TZ' : $timezone.getName(),
                'facet': true,
                'facet.mincount': 1,
                'facet.field': 'category',
                'facet.range': 'item_date',
                'facet.range.end': 'NOW/YEAR+1YEAR',
                'facet.range.start': 'NOW/YEAR-100YEAR',
                'facet.range.gap': '+1YEAR'
            }
        };

        $http.get(url, config)
            .success(function(data) {
                deferred.resolve(data);
            })
            .error(function(data) {
                deferred.resolve(data);
            });

        return deferred.promise;
    };

    return factory;
});
