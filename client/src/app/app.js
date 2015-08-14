'use strict';

var app = angular
    .module('billManagerApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'LocalStorageModule',
        'ui.bootstrap',
        'smart-table',
        'angular-loading-bar',
        'toaster',
        'highcharts-ng',
        'ngTimezone'
    ]);

app.config(function($routeProvider, localStorageServiceProvider, $compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);

    localStorageServiceProvider
        .setPrefix('billManagerApp')
        .setStorageType('sessionStorage');

    $routeProvider
        .when('/bill', {
            templateUrl: 'app/bill/bill.tpl.html',
            controller: 'BillCtrl'
        })
        .when('/system', {
            templateUrl: 'app/system/system.tpl.html',
            controller: 'SystemCtrl'
        })
        .when('/chart', {
            templateUrl: 'app/chart/chart.tpl.html',
            controller: 'ChartCtrl'
        })
        .when('/search', {
            templateUrl: 'app/search/search.tpl.html',
            controller: 'SearchCtrl'
        })
        .otherwise({
            redirectTo: '/bill'
        });
});
