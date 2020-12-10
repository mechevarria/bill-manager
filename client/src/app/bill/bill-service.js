'use strict';

app.factory('BillSrvc', function ($http, $q) {
  var resource = '/api/bill';
  var factory = {};

  factory.getAllBills = function () {
    var deferred = $q.defer();

    $http.get(resource).success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  factory.getBills = function (offset, max, sort, order) {
    var deferred = $q.defer();

    var url = resource;

    if (offset > 0) {
      offset = offset / max;
    }

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

    $http.get(resource + '/' + id).
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

    $http.post(resource, bill).
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

    $http.put(resource + '/' + bill.id, bill).
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

    $http.delete(resource + '/' + id).
      success(function (msg) {
        response = {
          type: 'success',
          msg: msg.text
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

  factory.getSummary = function() {
    var deferred = $q.defer();

    $http.get('/api/summary').success(function (data) {
      deferred.resolve(data);
    });

    return deferred.promise;
  };

  factory.getIds = function () {
    var deferred = $q.defer();

    $http.get('/api/summary').success(function (data) {
      var ids = [];

      // first entry is the bill id
      angular.forEach(data, function(bill) {
        ids.push(bill[0]);
      });

      deferred.resolve(ids);
    });

    return deferred.promise;
  };

  return factory;
});
