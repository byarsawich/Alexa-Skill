'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var EventDataHelper = require('../event_data_helper');
var EVENTLOCATIONENDPOINT = 'https://www.townofcary.org/API';

describe('EventDataHelper', function() {
  var today;
  var subject = new EventDataHelper();
  var uri = EVENTLOCATIONENDPOINT;
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

  describe('#formatEventData', function() {
    context('With a date', function() {
      context('with one or more scheduled events', function() {
        it('Returns an event', function() {
          /*this.timeout(5000);
          var startDate = '2017-03-24T00:00:00';
          var endDate = '2017-03-24T23:59:59';
          return subject.requestEventData(uri, startDate, endDate).then(function(response){
            expect(response.PagingList.Content[0].ID).to.eq(227);
          });*/
        });
      });
      // context('with no scheduled events', function() {
      //   it('Returns a canned no events scheduled message', function() {
      //     today = new Date('2017-03-23')
      //     // var value = subject.requestEventData(uri).then(function(obj) {
      //     //   return obj.PagingList.TotalResults.to.eventually.eq(0);
      //     // });
      //     var value = subject.requestEventData(uri)
      //     return expect(value.PagingList.TotalResults).to.eq(0);
      //   });
      // });
    });
    // This test was used to make sure helper function was being called correctly inside another function
    // context('when #formatEventTitles called inside #formatEventData', function() {
    //   it('returns event titles', function() {
    //     var value = subject.formatEventData(sampleReturnWithEvents)
    //     return expect(value).to.eq("Cary Ballet presents Spring Mixed Repertoire, NCSU Sigma Pi Break the Silence 5K Run/Walk")
    //   });
    // });
    context('when passed multiple events', function() {
      it('gives all events title, start, end', function() {
        var value = subject.formatEventData(sampleReturnWithEvents)
        expect(value).to.eq('On Sat Mar 25 there are 2 events: Cary Ballet presents Spring Mixed Repertoire starts at 07:00:00 PM, and ends at 11:59:00 PM  . NCSU Sigma Pi Break the Silence 5K Run/Walk starts at 10:00:00 AM, and ends at 02:00:00 PM  . ');
      });
    });
  });
  // used to check formating of titles before refactor
  // describe('#formatEventTitles', function() {
  //   context('eventTitles returns the event titles', function() {
  //     context('when multiple events scheduled', function() {
  //       it('returns all event titles', function() {
  //         var value = subject.formatEventTitles(sampleReturnWithEvents)
  //         return expect(value).to.eq("Cary Ballet presents Spring Mixed Repertoire, NCSU Sigma Pi Break the Silence 5K Run/Walk")
  //       });
  //     });
  //
  //     context('when no events scheduled', function() {
  //       it('returns no event message', function() {
  //         var value = subject.formatEventTitles(sampleReturnWithoutEvents)
  //         return expect(value).to.eq("There are no scheduled events for that day") // want to interpolate this to say day
  //       });
  //     });
  //   });
  // });

  // describe('#formatEventTimes', function() {
  //   context('')
  // });

});
