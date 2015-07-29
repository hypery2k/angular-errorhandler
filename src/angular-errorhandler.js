/*
 * angular-errorhandler
 * Copyright (C)2015 Martin Reinhardt
 * https://github.com/hypery2k/angular-errorhandler
 *
 * Version: 0.1.0
 * License: MIT
 */

var core = angular.module('ngErrorHandler.core', []);
var ui = angular.module('ngErrorHandler.ui', []);

// Core

// TODO move to config for translation
core.constant('httpErrors', {
    0: 'Der Server ist nicht erreichbar..',
    404: 'Dieser Dienst existiert nicht.',
    405: 'Zugriffsfehler.',
    500: 'Unbekannte Serverfehler.'
});

core.constant('errorHandlerConfig', {
    model: {
        alerts: 'alerts'
    },
    customErrorHandler: false,
    templateUrl: 'holi-error-handler-ui/error-handler-config.ng.html',
    template: '<alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"alerts.splice($index, 1)\">{{::alert.msg}}</alert>',
    feedbackAttach: false
});

core.provider('errorHandlerService', function () {
    'use strict';

    // Wrap a single function [func] in another function that handles both synchronous and asynchonous errors.
    function decorate($injector, obj, func) {
        return angular.extend(function () {
            var handler = $injector.get('errorHandlerService');
            return handler.call(func, obj, arguments);
        }, func);
    }

    // Decorate all functions of the service [$delegate] with error handling. This function should be used as decorator
    // function in a call to $provide.decorator().
    var decorator = ['$delegate', '$injector', function ($delegate, $injector) {
        // Loop over all functions in $delegate and wrap these functions using the [decorate] functions above.
        for (var prop in $delegate) {
            if (angular.isFunction($delegate[prop])) {
                $delegate[prop] = decorate($injector, $delegate, $delegate[prop]);
            }
        }
        return $delegate;
    }];

    // The actual service:
    return {
        // Decorate the mentioned [services] with automatic error handling.
        decorate: function ($provide, services) {
            angular.forEach(services, function (service) {
                $provide.decorator(service, decorator);
            });
        },

        $get: function ($log, $injector, feedbackUI, errorHandlerConfig, httpErrors) {

            var handler = {

                // The list of errors.
                errors: [],


                resolveErrorCode: function (func, err, callback) {
                    // This is a very limited error handler... you would probably want to check for user-friendly error messages
                    // that were returned by the server, etc, etc, etc. Our original code contains a lot of checks and handling
                    // of error messages to create the "perfect" error message for our users, you should probably do the same. :)
                    if (err) {

                        if (errorHandlerConfig.customErrorHandler) {
                            $injector.get(errorHandlerConfig.customErrorHandler).resolve(err, callback);

                        } else {
                            if (err && !angular.isUndefined(err.status)) {
                                // A lot of errors occur in relation to HTTP calls... translate these into user-friendly msgs.
                                err = httpErrors[err.status];
                            } else if (err && err.message) {
                                // Exceptions are unwrapped.
                                err = err.message;
                            }
                            if (!angular.isString(err)) {
                                err = 'Ein unbekannter Fehler ist aufgetreten.';
                            }

                            // Use the context provided by the service.
                            if (func && func.description) {
                                err = 'Aufruf zu ' + func.description + ' war fehlerhaft.';
                            }
                            $log.error('Es ist ein Fehler aufgetreten: ' + err);
                            callback(err);
                        }

                    }
                },
                // Report the error [err] in relation to the function [func].
                funcError: function (func, err) {
                    handler.resolveErrorCode(func, err, function (msg) {
                        if (errorHandlerConfig.feedbackAttach) {
                            feedbackUI.appendErrorMsg(msg);
                        }
                        handler.errors.push(msg);
                    });

                },


                // Call the provided function [func] with the provided [args] and error handling enabled.
                call: function (func, self, args) {
                    $log.debug('Function called: ', (func.name || func));

                    var result;
                    try {
                        result = func.apply(self, args);
                    } catch (err) {
                        // Catch synchronous errors.
                        handler.funcError(func, err);
                        throw err;
                    }

                    // Catch asynchronous errors.
                    var promise = result && result.$promise || result;
                    if (promise && angular.isFunction(promise.then) && angular.isFunction(promise['catch'])) {
                        // promise is a genuine promise, so we call [handler.async].
                        handler.async(func, promise);
                    }

                    return result;
                },


                // Automatically record rejections of the provided [promise].
                async: function (func, promise) {
                    promise['catch'](function (err) {
                        handler.funcError(func, err);
                    });
                    return promise;
                }
            };

            return handler;
        }
    };
});

core.factory('httpErrorInterceptor', function () {
    'use strict';

    return {
        request: function (config) {
            // 3 seconds timeout
            // TODO move to config
            config.timeout = 3000;
            return config;
        }
    };
});

core.config(function ($provide, $httpProvider) {
    'use strict';

    // adding interceptor, e.g. for timeouts ...
    $httpProvider.interceptors.push('httpErrorInterceptor');

    // configure exception logger
    $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
        return function (exception, cause) {
            $delegate(exception, cause);
        };
    }]);
});

// UI

ui.factory('feedbackUI', function (errorHandlerConfig, $timeout, $rootScope) {
        'use strict';

        // PUBLIC API

        return {
            appendErrorMsg: function (msg) {
                if (!$rootScope[errorHandlerConfig.model.alerts]) {
                    $rootScope[errorHandlerConfig.model.alerts] = [];
                }
                $rootScope[errorHandlerConfig.model.alerts].push({
                    type: 'danger',
                    msg: msg
                });
            },
            appendInfoMsg: function (msg) {
                if (!$rootScope[errorHandlerConfig.model.alerts]) {
                    $rootScope[errorHandlerConfig.model.alerts] = [];
                }
                $rootScope[errorHandlerConfig.model.alerts].push({
                    type: 'info',
                    msg: msg
                });
            }
        };
    }
);

ui.directive('uiErrorHandler', function ($rootScope, errorHandlerConfig) {
    'use strict';

    return {
        restrict: 'A',
        compile: function ($element) {
            // Class should be added here to prevent an animation delay error.
            $element.append(errorHandlerConfig.template);
        }
    };
});

ui.run(function ($rootScope, $document, errorHandlerConfig, $templateCache) {
    'use strict';


    // register listener to watch route changes
    $rootScope.$on('$routeChangeStart', function () {
        // reset alerts
        $rootScope[errorHandlerConfig.model.alerts] = [];
    });

    // trigger directive
    $document.find('.header').attr('ui-error-handler', '');

    if (errorHandlerConfig.template) {
        // Swap the builtin template with the custom template.
        // Create a magic cache key and place the template in the cache.
        errorHandlerConfig.templateUrl = '$$angular-errorhandler-template$$';
        $templateCache.put(errorHandlerConfig.templateUrl, errorHandlerConfig.template);
    }
});