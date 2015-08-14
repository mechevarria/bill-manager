'use strict';

app.factory('BillSrvc', function ($http, $q) {
  var resource = '/api/bill/';
  var factory = {};

  factory.getAllBills = function () {
    var deferred = $q.defer();

    $http.get(resource + 'index').success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  factory.getBills = function (offset, max, sort, order) {
    var deferred = $q.defer();

    var url = resource + 'index';

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

    $http.get(resource + 'get/' + id).
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

    $http.post(resource + 'save', bill).
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

    $http.put(resource + 'update', bill).
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

    $http.delete(resource + 'delete/' + id).
      success(function (msg) {
        response = {
          type: 'success',
          msg: msg
        };

        deferred.resolve(response);
      }).
      error(function (msg) {
        response = {
          type: 'error',
          msg: msg
        };

        deferred.resolve(response);
      });

    return deferred.promise;
  };

  factory.getIds = function () {
    var deferred = $q.defer();

    $http.get(resource + 'ids').success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  return factory;
});
