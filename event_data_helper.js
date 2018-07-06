'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var Promise = require('bluebird');
var crypto = require('crypto');
require('./jsDate.js')();
require('datejs');
var HelperClass = require('./helper_functions.js');

class EventDataHelper {
// line 254 index

  constructor(){}

requestEventData(uri, startDate, endDate) {
  var self = this;
  var helperClass = new HelperClass();
  return this.calendarEventFind(uri, startDate, endDate).then(function(response) {
    var json = JSON.parse(response);
    // json.PagingList.Content.forEach(function(item){
    //   item.Location = helperClass.EVENTLOCATIONS[item.CategoryID];
    // });
    // return json;
    console.log(response);
    console.log(json);
    return self.promiseWhile(uri, json, 0);
  }).catch(function(err) {
    console.log('Error in api call');
    console.log(err);
  });
};

calendarEventFind(uri, startDate, endDate){
  var options = { method: 'POST',
    url: uri,
    form: {
      _app_key: process.env.VISIONAPPKEY,
      _format: 'json',
      _method: 'vision.cms.calendarcomponent.event.find',
      _timestamp: new Date().toString('yyyy-MM-dd HH:mm:ss'),
      _v: process.env.VISIONAPPVERSION,
      CategoryIDsConstraint: null,
      DepartmentIDsConstraint: null,
      EndDate: endDate,
      Filter: null,
      PageIndex: '1',
      PageSize: '6',
      StartDate: startDate
   }
  };
  var sign = signAPIRequest(options.form).toUpperCase();
  options.form._sign = sign;
  return rp(options);
}

calendarEventGet(uri, id){
  var options = { method: 'POST',
    url: uri,
    form: {
      _app_key: process.env.VISIONAPPKEY,
      _format: 'json',
      _method: 'vision.cms.calendarcomponent.event.get',
      _timestamp: new Date().toString('yyyy-MM-dd HH:mm:ss'),
      _v: process.env.VISIONAPPVERSION,
      Fields: 16,
      ID: id
   }
  };
  var sign = signAPIRequest(options.form).toUpperCase();
  options.form._sign = sign;
  return rp(options);
}

signAPIRequest(params) {
  var returnVal = process.env.VISIONAPPSECRET;
  Object.keys(params).forEach(function(key) {
    if(params[key] !== null){
      returnVal += key + params[key];
    }
  });
  return crypto.createHash('md5').update(returnVal).digest("hex");


// promise loop to move to insert location into alexa return
promiseWhile(uri, results, i) {
  var self = this;
  return this.calendarEventGet(uri, results.PagingList.Content[i].ID).then(function(response) {
    var json = JSON.parse(response);
    results.PagingList.Content[i].Location = json.Event.Categories[0].Name
    return counter(i)
  }).then(function(response) {
    //using a hard stop of 6 here until the vision api is updated to include the location
    return (response >= results.PagingList.Content.length || response >= 5) ? results : self.promiseWhile(uri, results, response)
  }).catch(function(err){
    console.log('error on get api call');
    console.log(err);
  });
}

formatEventData(sampleReturn) {
  var helperClass = new HelperClass();
  var eventCount = sampleReturn.PagingList.Content.length
  var eventData =[];
  var eventContent = sampleReturn.PagingList.Content
  var response = '';

  if (eventCount === 0 ) {
    return 'There are no scheduled events for that day';
  } else {
    eventContent.forEach(function(item) {
      console.log(item);
      var location = (item.Location === null || item.Location === undefined) ? ' ' : 'at ' + item.Location;
      console.log(location);
      eventData += _.template('${eventTitle} starts at ${eventStart}, and ends at ${eventEnd} ${eventLocation}. ')({
        eventStart: helperClass.formatTimeString(Date.parse(item.StartDate)),
        eventEnd: helperClass.formatTimeString(Date.parse(item.EndDate)),
        eventTitle: item.Title,
        eventLocation: location
      });
    });
    response = _.template('On ${date} there ${prep} ${count} event${s}: ${eventData}')({
      date: helperClass.formatDate(Date.parse(eventContent[0].StartDate)),
      prep:  helperClass.getPrepostion(eventCount),
      count: eventCount,
      s: eventCount >= 2 ? 's' : '',
      eventData: eventData
    });

    return response;
  };
}

var counter = Promise.method(function(i){
    return i + 1;
});

}

module.exports = EventDataHelper;





//
