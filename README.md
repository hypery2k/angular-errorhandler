# angular-errorhandler


> A module for collecting errors, stack traces and other information globally from within your Angular app
> e.g. for saving to a remote service or for displaying

![Travis Build](https://api.travis-ci.org/hypery2k/angular-errorhandler.svg)
![Bower version](https://badge.fury.io/hypery2k/angular-errorhandler.svg)
![Dependencies](https://david-dm.org/hypery2k/angular-errorhandler.png)

##### Reasons to use
It's anyoing to handle all errors in controller and service and also very defective.
So instead of surfacing the log it would be cool to manage them at a central place and maybe store them via on a backend service

##### Usage

Install this module:

```
bower install angular-errorhandler
```

Add the dependencies
```
/*global app: true*/
var app = angular.module('resourcesApp', [
...
    'ngErrorHandler.core',
    'ngErrorHandler.ui' // optional
]);
```

If you like to display the error message within your app, also include the ui module.

Configure the service to be handled:

```
app.config(function ($provide, errorHandlerServiceProvider, errorHandlerConfig) {
    'use strict';

    // enable UI feedback attach
    errorHandlerConfig.feedbackAttach = true;
    errorHandlerConfig.customerErrorHandler = 'ErrorHandlingService';
    // decorate the mentioned [services] with automatic error handling.
    errorHandlerServiceProvider.decorate($provide, ['EventService']);
});

```

### About

This module instruments Angular's `interceptors` to invoke a configurable set for the error handling.

