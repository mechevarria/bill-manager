'use strict';

app.controller('SearchCtrl', function ($scope, $filter, SearchSrvc) {

  $scope.oneAtATime = true;

  function init() {
    $scope.sum = 0;
    $scope.count = 0;
    $scope.amountGap = SearchSrvc.amountGap;

    $scope.searchParams = [];

    $scope.searchOperators = [{
      label: 'Any terms',
      value: '',
      action: 'OR'
    }, {
      label: 'All terms',
      value: '+',
      action: 'AND'
    }];

    $scope.selectedOperator = $scope.searchOperators[0];

  }

  init();

  $scope.addCategoryParam = function (param) {
    $scope.searchParams.push({
      'label': 'category - ' + param,
      'value': 'category:' + param
    });
    // default to AND for drilldown
    $scope.selectedOperator = $scope.searchOperators[1];
    $scope.doSearch();
  };

  $scope.addDateParam = function (dateString) {
    var date = new Date(dateString);
    var dateFormat = 'yyyy-MM-ddTHH:mm:ss.000';

    // solr does all date math in UTC.
    var timeZone = 'UTC';
    $scope.searchParams.push({
      'label': 'Year - ' + date.getFullYear(),
      'value': 'item_date:[' + $filter('date')(date, dateFormat, timeZone) + 'Z TO ' + $filter('date')(date, dateFormat, timeZone) + 'Z+1YEAR]'
    });
    // default to AND for drilldown
    $scope.selectedOperator = $scope.searchOperators[1];
    $scope.doSearch();
  };

  $scope.getAmountLabel = function(param) {
    var start = parseInt(param);
    var end = start + $scope.amountGap;

    return '$' + start + ' to $' + end;
  };

  $scope.addPriceParam = function (param) {
    var start = parseInt(param);
    var end = start + $scope.amountGap;

    $scope.searchParams.push({
      'label': 'amount - ' + $scope.getAmountLabel(param),
      'value': 'price:' + '[' + start + ' TO ' + end + ']'
    });
    // default to AND for drilldown
    $scope.selectedOperator = $scope.searchOperators[1];
    $scope.doSearch();
  };

  $scope.addParam = function (param) {
    if (param.toString().length > 1) {
      $scope.searchParams.push({
        'label': param,
        'value': param
      });
      $scope.doSearch();
    }
  };

  $scope.removeParam = function (index) {
    $scope.searchParams.splice(index, 1);
    $scope.doSearch();
  };

  $scope.doSearch = function () {

    SearchSrvc.get($scope.searchParams, $scope.selectedOperator.value).then(function (data) {
      $scope.response = data;

      $scope.results = [];
      angular.forEach(data.response.docs, function (row) {
        var result = {
          category: row.category,
          date: row.item_date,
          amount: row.price,
          description: row.description,
          owner: row.author
        };
        $scope.results.push(result);

      });
      $scope.displayedResults = [].concat($scope.results);

      $scope.count = $scope.displayedResults.length;

      $scope.sum = 0;
      angular.forEach($scope.displayedResults, function (row) {
        $scope.sum += row.amount;
      });

      var facetCounts = $scope.response.facet_counts;

      $scope.categoryFacets = getFacets(facetCounts.facet_fields.category);
      $scope.dateFacets = getFacets(facetCounts.facet_ranges.item_date.counts);
      $scope.priceFacets = getFacets(facetCounts.facet_ranges.price.counts);
    });
  };

  function getFacets(rawArray) {
    var facets = [];

    for (var i = 0; i < rawArray.length; i++) {
      facets.unshift({
        label: rawArray[i],
        value: rawArray[i + 1]
      });
      i++;
    }

    return facets;
  }

});
