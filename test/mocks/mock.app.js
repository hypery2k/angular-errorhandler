/*global mockApp: true*/
var app = angular.module('appMock', [
    'ngErrorHandler.core',
    'ngErrorHandler.ui'
]);

app.config(function ($provide, errorHandlerServiceProvider, errorHandlerConfig) {
    'use strict';

    // enable UI feedback attach
    errorHandlerConfig.feedbackAttach = true;
    errorHandlerConfig.customerErrorHandler = 'myErrorHandlingService';
    // decorate the mentioned [services] with automatic error handling.
    errorHandlerServiceProvider.decorate($provide, ['eventService']);
});

app.factory('myErrorHandlingService', function ($http) {
        'use strict';

        return {
            resolve: function (error, callback) {
            }
        };
    }
);

app.factory('eventService', function ($http) {
        'use strict';
        return {
            list: function (id, callback) {
                $http.get('http://example.org/events/' + id).
                    success(function (data) {
                        return callback(data);
                    });
            }
        };
    }
);