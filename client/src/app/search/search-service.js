'use strict';

app.factory('SearchSrvc', function($http, $q) {
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
            'TZ' : moment.tz.guess()
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
                    'msg': data.command + ' command posted'
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
  
    factory.amountGap = 100;

    factory.get = function(params, operator) {

        var query = '';
        angular.forEach(params, function(param) {
            query += operator + param.value + ' ';
        });

        var deferred = $q.defer();

        var url = resource + '/select';

        //noinspection JSDuplicatedDeclaration
      var config = {
            params: {
              'wt': 'json',
              'q': query,
              'rows': 2147483647,
              'TZ' : moment.tz.guess(),
              'facet': true,
              'facet.mincount': 1,
              'facet.field': 'category',
              'facet.range': ['item_date', 'price'],
              'f.item_date.facet.range.end': 'NOW/YEAR+1YEAR',
              'f.item_date.facet.range.start': 'NOW/YEAR-100YEAR',
              'f.item_date.facet.range.gap': '+1YEAR',
              'f.price.facet.range.start': '0',
              'f.price.facet.range.end': '10000',
              'f.price.facet.range.gap': factory.amountGap

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
