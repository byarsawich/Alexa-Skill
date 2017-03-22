'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var EventDataHelper = require('../event_data_helper');

describe('EventDataHelper', function() {
  var today;
  var subject = new EventDataHelper();
  var uri = 'http://www.townofcary.org/API'

  context('With a date', function() {
    context('with one or more scheduled events', function() {
      it('Returns an event', function() {
        today = new Date('2017-03-25')
        // var value = subject.requestEventData(uri)//.then(function(obj) {
        //   return obj.PagingList.Content.ID;
        //
        // });
        var value = subject.requestEventData(uri)

        return expect(value.PagingList.Content[0].ID).to.eq(229);

      });

    });

    context('with no scheduled events', function() {
      it('Returns a canned no events scheduled message', function() {
        today = new Date('2017-03-23')
        // var value = subject.requestEventData(uri).then(function(obj) {
        //   return obj.PagingList.TotalResults.to.eventually.eq(0);
        // });
        var value = subject.requestEventData(uri)
          return expect(value.PagingList.TotalResults).to.eq(0);
      });
    });
  });
  // event variables
  var sampleReturnWithEvents =
    {
      "PagingList":{
        "TotalResults":4,
        "HasNext":false,
        "Content":[
          {
            "ID":229,
            "Title":"Cary Ballet presents Spring Mixed Repertoire",
            "StartDate":"2017-03-25T19:00:00",
            "EndDate":"2017-03-25T23:59:00",
            "DisplayLinkToDocumentViewer":false,
            "AllowNotification":false,
            "Content":"stuff about ballet event",
            "RedirectTarget":"_self",
            "State":"",
            "ThumbnailImage":"",
            "AllowRegistration":false
          },
          {
             "ID":1681,
             "Title":"NCSU Sigma Pi Break the Silence 5K Run/Walk",
             "StartDate":"2017-03-25T10:00:00",
             "EndDate":"2017-03-25T14:00:00",
             "DisplayLinkToDocumentViewer":false,
             "AllowNotification":false,
             "Content":"stuff about second sigma event",
             "RedirectTarget":"_self",
             "State":"",
             "ThumbnailImage":"",
             "AllowRegistration":false
           }
         ]
       }
     }
  var sampleReturnWithoutEvents =
     {
       "PagingList":{
         "TotalResults":0,
         "HasNext":false,
         "Content":[
         ]
       }
     }

  context('#formatEventData returns the count of events', function() {
    it('returns the number of events when events are scheduled', function() {
      var today = new Date('2017-03-25')
      var value = subject.formatEventData(sampleReturnWithEvents)
        return expect(value.eventCount).to.eq(2)
    });
    it('returns 0 if there are no events', function() {
      var today = new Date('2017-03-22')
      var value = subject.formatEventData(sampleReturnWithoutEvents)
        return expect(value.eventCount).to.eq(0)
    });
  });

  context('eventTitle returns the event titles', function() {
    context('when multiple events scheduled', function() {
      it('returns all event titles', function() {
        var value = subject.formatEventData(sampleReturnWithEvents)
          return expect(value.eventTitle).to.eq("Cary Ballet presents Spring Mixed Repertoire, NCSU Sigma Pi Break the Silence 5K Run/Walk")
      });
    });

    context('when no events scheduled', function() {
      it('returns no event message', function() {
        var value = subject.formatEventData(sampleReturnWithoutEvents)
          return expect(value.eventTitle).to.eq("There are no scheduled events for that dat") // want to interpolate this to say day
      });
    });
  });
});
