'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var HelperClass = require('./helper_functions.js');

 class OpenDataHelper{

   constructor(){}

requestOpenData(uri) {
  return this.getOpenData(uri).then(function(response) {
    return response.body;
  }).catch(function (error) {
    console.log(error);
    console.log('error in the promise');
  });
};

getOpenData(uri) {
  var options = {
    method: 'GET',
    uri: encodeURI(uri),
    resolveWithFullResponse: true,
    json: true,
    timeout: 3000
  };
  return rp(options);
};

formatGymTimes(gymTimes) {
  var times = '';
  var helperClass = new HelperClass();
  var sortedGyms = {}
  gymTimes.records.forEach(function(item){
    var newKey = helperClass.FIELDNAMEPAIRINGS[item.fields.facility_title.toUpperCase()]
    if(sortedGyms[newKey] === undefined){
      sortedGyms[newKey] = [];
    }
    sortedGyms[newKey].push(item.fields);
  });
  for (var key in sortedGyms) {
    if (sortedGyms.hasOwnProperty(key)) {
      times += _.template(' At ${park} the ${time} ${prep}:')({
        park: key,
        time: sortedGyms[key].length >= 2 ? 'times' : 'time',
        prep: helperClass.getPrepostion(sortedGyms[key].length)
      });
      sortedGyms[key].forEach(function(item){
        var startTime = new Date(item.open_gym_start);
        var endTime = new Date(item.open_gym_end);
        times += _.template(' ${startTime} to ${endTime} for ${sport}.')({
          startTime: helperClass.formatTimeString(startTime),
          endTime: helperClass.formatTimeString(endTime),
          sport: item.open_gym
        });
      });
    }
  }
  if(gymTimes.records.length > 0) {
    var response = _.template('There ${prep} ${numTimes} open gym ${time} on ${date}.${times}');
    return response({
      prep: helperClass.getPrepostion(gymTimes.records.length),
      numTimes: gymTimes.records.length,
      time: gymTimes.records.length >= 2 ? 'times' : 'time',
      date: helperClass.formatDate(Date.parse(gymTimes.records[0].fields.date_scanned)),
      times: times
    });
  } else {
    var response = 'There are no open gym times for that date.';
    return response
  }
};

formatStudioTimes(studioTimes) {
  var times = '';
  var helperClass = new HelperClass();
  studioTimes.records.forEach(function(item, index){
    var startTime = new Date(item.fields.open_gym_start);
    var endTime = new Date(item.fields.open_gym_end);
    times += _.template(' ${startTime} to ${endTime}${sentanceEnd}')({
      startTime: helperClass.formatTimeString(startTime),
      endTime: helperClass.formatTimeString(endTime),
      sentanceEnd: (index === studioTimes.records.length - 1) ? "." : " and,"
    });

  });
  if(studioTimes.records.length > 0) {
    var response = _.template('There ${prep} ${numTimes} open studio ${time} on ${date} from${times}');
    return response({
      prep:  helperClass.getPrepostion(studioTimes.records.length),
      numTimes: studioTimes.records.length,
      time: studioTimes.records.length >= 2 ? 'times' : 'time',
      date: helperClass.formatDate(Date.parse(studioTimes.records[0].fields.date_scanned)),
      times: times
    });
  } else {
    var response = 'There are no open studio times for that date.';
    return response
  }
};

formatNextStudioTime(studioTimes) {
  var times = '';
  var helperClass = new HelperClass();
  var response = '';
  if(studioTimes.records.length >= 1){
    var startTime = new Date(studioTimes.records[0].fields.open_gym_start);
    var endTime = new Date(studioTimes.records[0].fields.open_gym_end);
    response = _.template('The next open studio time is on ${date} at ${gym} from ${startTime} to ${endTime}.')({
      date: helperClass.formatDate(Date.parse(studioTimes.records[0].fields.date_scanned)),
      gym: helperClass.FIELDNAMEPAIRINGS[studioTimes.records[0].fields.facility_title.toUpperCase()],
      startTime: helperClass.formatTimeString(startTime),
      endTime: helperClass.formatTimeString(endTime),
    });
  } else {
    response = "There is a problem with the connection to the open dates.  Please try again later."
  }
  return response;
};

formatMayor(cityInfo) {
  var response = '';
  cityInfo.records.forEach(function(item){
    response = _.template('The mayor of Cary is ${mayor}.')({
      mayor: item.fields.mayor
    });
  });
  if (response == '') {
    throw new Error('No fields in results');
  } else {
    return response;
  }
};

formatAllCouncilMembers(cityInfo) {
  var response = '';
  var mayor = '';
  cityInfo.records.forEach(function(item){
    response += _.template('The council member for district ${district}, is ${member}. ')({
      district: item.fields.name,
      member: item.fields.repname
    });
    mayor = item.fields.mayor;
  });
  var atLarge = [];
  cityInfo.facet_groups[0].facets.forEach(function(item){
    atLarge.push(item.name);
  });
  if (atLarge.size == 0 ){
    throw new Error('No at large representatives returned');
  } else {
    response += _.template('The at large representatives are ${rep1}, and ${rep2} and the mayor is ${mayor}.')({
      rep1: atLarge[0],
      rep2: atLarge[1],
      mayor: mayor
    });
  }
  if (response == '') {
    throw new Error('No fields in results');
  } else {
    return response;
  }
};

formatAtLargeCouncilMembers(cityInfo) {
  var response = '';
  var atLarge = [];
  cityInfo.facet_groups[0].facets.forEach(function(item){
    atLarge.push(item.name);
  });
  if (atLarge.size == 0 ){
    throw new Error('No at large representatives returned');
  } else {
    response += _.template('Your at large representatives are ${rep1}, ${rep2}, and ${mayor} is the mayor.')({
      rep1: atLarge[0],
      rep2: atLarge[1],
      mayor: cityInfo.records[0].fields.mayor
    });
  }
  if (response == '') {
    throw new Error('No fields in results');
  } else {
    return response;
  }
};
}

module.exports = OpenDataHelper;
