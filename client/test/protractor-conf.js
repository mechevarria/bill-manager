'use strict';

var Jasmine2HtmlReporter = require('protractor-jasmine2-html-reporter');

exports.config = {
    allScriptsTimeout: 11000,

    specs: [
        'e2e/**/*.js'
    ],

    capabilities: {
        'browserName': 'firefox'
    },

    maxSessions: 1,

    baseUrl: 'http://localhost:9000/',

    framework: 'jasmine2',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    },

    onPrepare: function() {
        jasmine.getEnv().addReporter(
            new Jasmine2HtmlReporter({
                savePath: '.tmp/',
                takeScreenshots: true,
                consolidate: true,
                consolidateAll: true
            })
        );
    }
};
