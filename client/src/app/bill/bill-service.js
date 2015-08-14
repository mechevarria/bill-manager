'use strict';

app.factory('BillSrvc', function ($http, $q) {
  var resource = '/api/bill/';
  var factory = {};

  factory.getAllBills = function () {
    var deferred = $q.defer();

    $http.get(resource + 'index.json').success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  factory.getBills = function (offset, max, sort, order) {
    var deferred = $q.defer();

    var url = resource + 'index.json';

    var config = {
      params: {
        size: max,
        start: offset,
        sort: sort,
        order: order
      }
    };

    $http.get(url, config).success(function (data) {
      var bills = data.bills;
      var count = data.count;
      var numberOfPages = Math.ceil(count / max);

      deferred.resolve({
        bills: bills,
        numberOfPages: numberOfPages
      });
    });

    return deferred.promise;
  };

  factory.get = function (id) {
    var deferred = $q.defer();

    $http.get(resource + 'get/' + id + '.json').
      success(function (data) {
        deferred.resolve(data);
      }).
      error(function () {
        deferred.resolve(null);
      });

    return deferred.promise;
  };

  factory.add = function (bill) {
    var deferred = $q.defer();
    var response = {};

    $http.post(resource + 'save.json', bill).
      success(function (data) {
        response = {
          data: data,
          type: 'success',
          msg: bill.month + ' ' + bill.year + ' saved successfully'
        };

        deferred.resolve(response);
      }).
      error(function (data) {
        response = {
          type: 'error',
          msg: data
        };

        deferred.resolve(response);
      });

    return deferred.promise;
  };

  factory.update = function (bill) {
    var deferred = $q.defer();
    var response = {};

    $http.put(resource + 'update.json', bill).
      success(function (data) {
        response = {
          data: data,
          type: 'success',
          msg: bill.month + ' ' + bill.year + ' updated successfully'
        };

        deferred.resolve(response);
      }).
      error(function (data) {
        response = {
          type: 'error',
          msg: data
        };

        deferred.resolve(response);
      });

    return deferred.promise;
  };

  factory.delete = function (id) {
    var deferred = $q.defer();
    var response = {};

    $http.delete(resource + 'delete/' + id + '.json').
      success(function (data) {
        response = {
          type: 'success',
          msg: data.msg
        };

        deferred.resolve(response);
      }).
      error(function (data) {
        response = {
          type: 'error',
          msg: data
        };

        deferred.resolve(response);
      });

    return deferred.promise;
  };

  factory.getIds = function () {
    var deferred = $q.defer();

    $http.get(resource + 'ids.json').success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  return factory;
});
