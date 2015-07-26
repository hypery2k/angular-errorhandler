describe('Service: ErrorHandler', function () {
    'use strict';

    // load the controller's module
    beforeEach(module('appMock'));

    // framework services
    var errService,
        feedbackUIService,
    // app services
        myErrService,
        busService,
        scope,
        httpBackend;

    // Initialize the service
    beforeEach(inject(function ($rootScope, $httpBackend, errorHandlerService, feedbackUI, myErrorHandlingService, eventService) {
        scope = $rootScope.$new();
        httpBackend = $httpBackend;
        errService = errorHandlerService;
        feedbackUIService = feedbackUI;
        myErrService = myErrorHandlingService;
        busService = eventService;
        // create spies
        spyOn(errService, 'funcError');
        spyOn(myErrService, 'resolve');
        spyOn(feedbackUIService, 'appendErrorMsg');
    }));

    it('should not attach any message without an error', function (done) {
        httpBackend.expectGET('http://example.org/events/1')
            .respond(200, [{id: 1, value: 'sample1'}, {id: 1, value: 'sample1'}]);
        busService.list('1', function (events) {
            expect(events.length).toBe(2);
            expect(errService.funcError).not.toHaveBeenCalled();
            expect(myErrService.resolve).not.toHaveBeenCalled();
            expect(feedbackUIService.appendErrorMsg).not.toHaveBeenCalled();
            done();
        }, function (err) {
            fail();
        });
        httpBackend.flush();
        scope.$apply();
    });

    it('should  attach any message with an error', function (done) {
        httpBackend.expectGET('http://example.org/events/1')
            .respond(500);
        busService.list('1', function (events) {
            fail();
        }, function (err) {
            fail();
        });
        httpBackend.flush();
        scope.$apply();
        expect(errService.funcError).not.toHaveBeenCalled();
        expect(myErrService.resolve).not.toHaveBeenCalled();
        expect(feedbackUIService.appendErrorMsg).not.toHaveBeenCalled();
        done();
    });
});
