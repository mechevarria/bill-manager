'use strict';

app.factory('DeleteSrvc', function($rootScope, $timeout, BillSrvc, SearchSrvc) {
    var factory = {};

    factory.delete = function() {
        BillSrvc.getIds().then(function(data) {
            var idList = data;

            processIds(idList, 0);
        });

    };

    function processIds(idList, index) {
        if (index === idList.length) {
            SearchSrvc.dataImport().then(function(data) {

                $rootScope.$emit('notify', {
                    'type': data.type,
                    'msg': data.msg
                });
            });
        } else {
            BillSrvc.delete(idList[index]).then(function(response) {

                $rootScope.$emit('notify', {
                    'type': response.type,
                    'msg': response.msg
                });

                index++;
                $timeout(function() {
                    processIds(idList, index);
                }, 50);
            });
        }
    }

    return factory;
});
