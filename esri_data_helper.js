'use strict';
var _ = require('lodash');
var rp = require('request-promise');
var HelperClass = require('./helper_functions.js');
var EventDataHelper = require('./event_data_helper');
var moment = require('moment');
require('./jsDate.js')();
require('datejs');
var EVENTDATAENDPOINT = 'http://www.townofcary.org/API';
var ESRIENDPOINT = 'https://maps.townofcary.org/arcgis1/rest/services/';
var EARTHRADUIS = 3959;
var RECYCLEYELLOWSTART = '2017-01-01';
var RECYCLEBLUESTART = '2017-01-08';
var DAYS = {
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday'
}
function EsriDataHelper() { }

EsriDataHelper.prototype.requestAddressInformation = function(address) {
  var self = this;
  return this.getAddressGeolocation(address).then(
    function(response) {
      return response.body;
    }, function (error) {
        console.log('error in the promise');
    }
  ).catch(console.log.bind(console));
}

EsriDataHelper.prototype.getAddressGeolocation = function(address) {
  var uri = ESRIENDPOINT + 'Locators/Cary_Com_Locator/GeocodeServer/findAddressCandidates?Street=' + address + '&City=&State=&ZIP=&SingleLine=&outFields=*&maxLocations=&outSR=4326&searchExtent=&f=pjson';
  console.log(uri);
  var options = {
    method: 'GET',
    uri: encodeURI(uri),
    resolveWithFullResponse: true,
    json: true,
    timeout: 3000
  };
  return rp(options);
};

EsriDataHelper.prototype.requestESRIInformation = function(uri) {
  return this.getESRIInformation(uri).then(
    function(response) {
      return response.body;
    }, function (error) {
        console.log('error in the promise');
    }
  ).catch(console.log.bind(console));
};

EsriDataHelper.prototype.getESRIInformation = function(uri) {
  var options = {
    method: 'GET',
    uri: encodeURI(uri),
    resolveWithFullResponse: true,
    json: true,
    timeout: 3000
  };
  return rp(options);
};

EsriDataHelper.prototype.requestInformationByRadius = function(x, y, distance, uri) {
  return this.getInformationByRadius(x, y, distance, uri).then(
    function(response) {
      return response.body;
    }, function (error) {
        console.log('error in the promise');
    }
  ).catch(console.log.bind(console));
};

EsriDataHelper.prototype.getInformationByRadius = function(x, y, distance, uri) {
  //radius of earth is 3959 miles
  var helperClass = new HelperClass();
  var radius = distance / EARTHRADUIS;
  var coords = helperClass.getCircleCoords(x,y,radius);
  var finalUri = uri + '?where=&objectIds=&time=&geometry={"rings":[[' + coords + ']]}&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelContains&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&gdbVersion=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&f=pjson'
  var options = {
    method: 'GET',
    uri: encodeURI(finalUri),
    resolveWithFullResponse: true,
    json: true,
    timeout: 3000
  };
  return rp(options);
};

EsriDataHelper.prototype.formatMyCouncilMember = function(councilInfo) {
  var prompt = '';
  councilInfo.results.forEach(function(item){
    if (typeof item.attributes["Council Distict"] != 'undefined'){
      prompt = _.template('You belong to District ${district}, and your Council Member is ${member}. Your at large council members are ${atLarge1}, and ${atLarge2}. The mayor is ${mayor}.')({
        district: item.attributes["Council Distict"],
        member: item.attributes["Representative Name"],
        atLarge1: item.attributes["At Large Representative 1"],
        atLarge2: item.attributes["At Large Representative 2"],
        mayor: item.attributes["Mayor"]
      });
    }
  });
  return prompt;
};

EsriDataHelper.prototype.formatNearbyParks = function(parkInfo) {
  var helperClass = new HelperClass();
  var prompt = 'There are ' + parkInfo.features.length + ' parks nearby including ';
  parkInfo.features.forEach(function(item){
    prompt += _.template('${parkName} located at ${address}, ')({
      parkName: item.attributes["NAME"],
      address: helperClass.formatAddress(item.attributes["FULLADDR"])
    });
  });
  return prompt;
};

EsriDataHelper.prototype.formatNearbyPublicArt = function(artInfo) {
  var helperClass = new HelperClass();
  var prompt = '';
  var numArt = artInfo.features.length;
  artInfo.features.forEach(function(item){
    if(item.attributes["Address"] != null){
      prompt += _.template('${artName} located at ${address}, ')({
        artName: item.attributes["Name"],
        address: helperClass.formatAddress(item.attributes["FULLADDR"])
      });
    } else {
      numArt  = numArt - 1;
    }
  });
  prompt = _.template('There are ${num} pieces of public art nearby including ')({
    num: numArt
  }) + prompt;
  return prompt;
};

EsriDataHelper.prototype.formatMyTrashDay = function(trashInfo) {
  var helperClass = new HelperClass();
  var trashDay =  DAYS[trashInfo.features[0].attributes.Day.toUpperCase()];
  var cycle = trashInfo.features[0].attributes.Cycle.toUpperCase();
  var nextDays = {};
  //If trash day equals today
  if(Date.parse(trashDay).equals(Date.today())){
    nextDays.Trash = helperClass.formatDate(Date.parse(Date.today()));
  } else {
    nextDays.Trash = helperClass.formatDate(Date.parse('next ' + trashDay));
  }
  nextDays.Recycle = helperClass.getRecycleDay(cycle, trashDay);
  var prompt = '';
  nextDays = this.checkTrashDays(nextDays);
  console.log('The two days trash first');
  console.log(nextDays);
  if(nextDays.Recycle == nextDays.Trash){
    prompt = _.template('Your next trash and recycle day is ${nextTrash}')({
      nextTrash: nextDays.Trash
    });
  } else {
    prompt = _.template('Your next trash day is ${nextTrash} and your recycle date is the next week, ${nextRecycle}')({
      nextTrash: nextDays.Trash,
      nextRecycle: nextDays.Recycle
    });
  }
  return prompt;
};

EsriDataHelper.prototype.checkTrashDays = function (NextDays) {
  var uri = EVENTDATAENDPOINT;
  var helperClass = new HelperClass();
  console.log(NextDays);
  var eventDataHelper = new EventDataHelper();
  var trashDay = Date.yyyymmdd(Date.parse(NextDays.Trash));
  var recycleDay = Date.yyyymmdd(Date.parse(NextDays.Recycle));
  var trashStartDate = moment(trashDay).startOf('week');
  console.log(trashStartDate);
  var trashEndDate = moment(trashDay).endOf('week');
  var recStartDate = moment(recycleDay).startOf('week');
  var recEndDate = moment(recycleDay).endOf('week');
  if (NextDays.Trash == NextDays.Recycle) {
    return eventDataHelper.requestEventData(uri, trashStartDate, trashEndDate, 'Town Holiday').then(function(response) {
      console.log(response);
      if (response.PagingList.TotalResults <= 0) {
        return NextDays;
      } else {
        var holidayDay = response.PagingList.Content.StartDate.moment().day();
        if (moment(trashDay).day() >= holidayDay) {
          NextDays.Trash = helperClass.formatDate(moment(trashDay).add(1, 'd'));
          NextDays.Recycle = helperClass.formateDate(moment(trashDay).add(1, 'd'));
        }
        return NextDays;
      }
    });
  } else {
    NextDays.Trash = eventDataHelper.requestEventData(uri, trashStartDate, trashEndDate, 'Town Holiday').then(function(response) {
      console.log(response);
      if (response.PagingList.TotalResults <= 0) {
        return NextDays.Trash;
      } else {
        var holidayDay = response.PagingList.Content.StartDate.moment().day();
        if (moment(trashDay).day() >= holidayDay) {
          NextDays.Trash = helperClass.formatDate(moment(trashDay).add(1, 'd'));
        }
        return NextDays.Trash;
      }
    });
    NextDays.Recycle = eventDataHelper.requestEventData(uri, recStartDate, recEndDate, 'Town Holiday').then(function(response) {
      console.log(response);
      if (response.PagingList.TotalResults <= 0) {
        return NextDays.Recycle;
      } else {
        var holidayDay = response.PagingList.Content.StartDate.moment().day();
        if (moment(recycleDay).day() >= holidayDay) {
          NextDays.Recycle = helperClass.formatDate(moment(recycleDay).add(1, 'd'));
        }
        return NextDays.Recycle;
      }
    });
    console.log(NextDays);
    return NextDays;
  }
};

module.exports = EsriDataHelper;
