'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var HelperClass = require('./helper_functions.js');
var promise = require('bluebird');
require('./jsDate.js');
require('datejs');
var FIELDSTATUSENDPOINT = 'http://games.townofcarync.gov';
var FIELDTYPES = ['/ballfields/ballfields.txt', '/multipurposefields/multipurposefields.txt', '/gymnasiums/gymnasiums.txt', '/soccerpark/soccerpark.txt', '/usabaseball/usabaseball.txt'];

class FieldStatusHelper{

  constructor(){}

  get FIELDSTATUSENDPOINT() {
    return FIELDSTATUSENDPOINT;
  };

  get FIELDTYPES() {
    return FIELDTYPES;
  };


getAllFieldStatus(){
  var results = {};
  return this.promiseLoop(results, 0).then(function(response){
    return response
  });
}

requestFieldStatus(uri){
  var options = {
    method: 'GET',
    uri: encodeURI(uri),
    resolveWithFullResponse: true,
    timeout: 3000
  };
  return rp(options);
}

promiseLoop(results, i){
  var helperClass = new HelperClass();
  var self = this;
  return this.requestFieldStatus(FIELDSTATUSENDPOINT + FIELDTYPES[i]).then(function(response){
      return helperClass.addFieldResults(response.body, results);
  }).then(function(response){
    results = response;
    return counter(i);
  }).then(function(response){
    return (response >= FIELDTYPES.length) ? results : self.promiseLoop(results, response);
  });
}

formatFieldStatus(fieldStatus, parkQuery){
  var prompt;
  var helperClass = new HelperClass();
  var parkName = helperClass.FIELDNAMEPAIRINGS[parkQuery.toUpperCase()] || parkQuery.toUpperCase();
  if(fieldStatus[parkName].closed.length <= 0){
      prompt = _.template('All fields at ${park} are currently open')({
        park: parkName
      });
  } else {
    if(fieldStatus[parkName].open.length <= 0){
      prompt = _.template('All fields at ${park} are currently closed')({
        park: parkName
      });
    } else {
      var closedFields = fieldStatus[parkName].closed.join(', ')
      prompt = _.template('At ${park}, the following list of facilities are closed. ${fields}')({
        park: parkName,
        fields: closedFields
      });
    }
  }
  return prompt;
}

var counter = promise.method(function(i){
    return i + 1;
});
}
module.exports = FieldStatusHelper;
