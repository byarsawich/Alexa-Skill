'use strict';
var promise = require('bluebird');
var RECYCLEYELLOWSTART = '2017-01-01';
var RECYCLEBLUESTART = '2017-01-08';
var CASESUBJECTPAIRINGS = {'YARD WASTE': 'COLLECTION', 'OIL': 'COLLECTION', 'CARDBOARD': 'COLLECTION', 'LEAF': 'COLLECTION', 'TRASH': 'MISSED', 'RECYCLING': 'MISSED', 'GARBAGE': 'MISSED', 'RUBBISH': 'MISSED', 'WASTE': 'MISSED', 'LEAVES': 'COLLECTION'};
const FIELDNAMEPAIRINGS = {
'MILLS PARK MIDDLE SCHOOL': 'MILLS PARK',
'MILLS PARK MIDDLE': 'MILLS PARK',
'MILLS PARK': 'MILLS PARK',
'MIDDLE CREEK COMMUNITY CENTER': 'MIDDLE CREEK',
'MIDDLE CREEk SCHOOL/PARK': 'MIDDLE CREEK',
'MIDDLE CREEK': 'MIDDLE CREEK',
'HERBERT C. YOUNG COMMUNITY CENTER': 'HERBERT YOUNG',
'HERBERT C. YOUNG': 'HERBERT YOUNG',
'HERB YOUNG': 'HERBERT YOUNG',
'HERBERT YOUNG COMMUNITY CENTER': 'HERBERT YOUNG',
'HERBERT YOUNG': 'HERBERT YOUNG',
'BOND PARK COMMUNITY CENTER': 'BOND PARK',
'BOND PARK': 'BOND PARK',
'CARY HIGH SCHOOL': 'CARY HIGH',
'CARY HIGH': 'CARY HIGH',
'DAVIS DRIVE MIDDLE SCHOOL': 'DAVIS DRIVE',
'DAVIS DRIVE MIDDLE': 'DAVIS DRIVE',
'DAVIS DRIVE': 'DAVIS DRIVE',
'GREEN HOPE ELEMENTARY SCHOOL': 'GREEN HOPE ELEMENTARY',
'GREEN HOPE ELEMENTARY': 'GREEN HOPE ELEMENTARY',
'GREEN HOPE HIGH SCHOOL': 'GREEN HOPE HIGH',
'GREEN HOPE HIGH': 'GREEN HOPE HIGH',
'GREEN HOPE': 'GREEN HOPE HIGH',
'LEXIE LANE PARK': 'LEXIE LANE',
'LEXIE LANE': 'LEXIE LANE',
'USA BASEBALL NATIONAL TRAINING COMPLEX': 'USA BASEBALL',
'USA BASEBALL COMPLEX': 'USA BASEBALL',
'USA BASEBALL': 'USA BASEBALL',
'WAKEMED': 'WAKEMED SOCCER',
'WAKEMED SOCCER': 'WAKEMED SOCCER',
'WAKEMED SOCCER PARK': 'WAKEMED SOCCER',
'CARY ELEMENTARY SCHOOL': 'CARY ELEMENTARY',
'CARY ELEMENTARY': 'CARY ELEMENTARY',
'PANTHER CREEK HIGH SCHOOL': 'PANTHER CREEK',
'PANTHER CREEK HIGH': 'PANTHER CREEK',
'PANTHER CREEK': 'PANTHER CREEK',
'REEDY CREEK MIDDLE SCHOOL': 'REEDY CREEK',
'REEDY CREEK MIDDLE': 'REEDY CREEK',
'REEDY CREEK': 'REEDY CREEK',
'WEST CARY MIDDLE SCHOOL': 'WEST CARY',
'WEST CARY MIDDLE': 'WEST CARY',
'WEST CARY': 'WEST CARY',
'EAST CARY MIDDLE SCHOOL': 'EAST CARY',
'EAST CARY MIDDLE': 'EAST CARY',
'EAST CARY': 'EAST CARY',
'THOMAS BROOKS PARK': 'THOMAS BROOKS',
'THOMAS BROOKS': 'THOMAS BROOKS',
'ANNIE JONES PARK': 'ANNIE JONES',
'ANNIE JONES': 'ANNIE JONES',
'LIONS PARK': 'LIONS PARK',
'RITTER PARK': 'RITTER PARK',
'CARY ARTS CENTER': 'CARY ARTS CENTER',
'CARY ARTS': 'CARY ARTS CENTER'};

class HelperClass{

  constructor(){ }


get FIELDNAMEPAIRINGS() {
  return FIELDNAMEPAIRINGS;
};

get EVENTLOCATIONS() {
  return EVENTLOCATIONS;
};

//date formating functions to make a response sound better for alexa
formatDate(date) {
  var i = date.toString().search(/20\d{2}/);
  if (i > 0) {
    return date.toString().slice(0, i).trim();
  }
  return date;
};

formatDateTime(dateTime) {
  if (dateTime !== null && dateTime !== undefined){
    return this.formatDate(dateTime) + ' at ' +  this.formatTimeString(dateTime);
  }
  return null;
};

formatTimeString(date) {
  if ((typeof(date) !== 'object') || (date.constructor !== Date)) {
    throw new Error('argument must be a Date object');
  }
  function pad(s) { return (('' + s).length < 2 ? '0' : '') + s; }
  function fixHour(h) { return (h == 0 ? '12' : (h > 12 ? h - 12 : h)); }

  var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds(), timeStr = [pad(fixHour(h)), pad(m), pad(s)].join(':');
  return timeStr + ' ' + (h < 12 ? 'AM' : 'PM');
};

formatAddress(fullAddress) {
  var sliceIndex = fullAddress.toUpperCase().search('CARY') || fullAddress.toUpperCase().search('APEX') || fullAddress.toUpperCase().search('MORRISVILLE');
	return fullAddress.slice(0, sliceIndex - 1).trim();
};

getRecycleDay(cycle, trashDay) {
  var diff;
  if (cycle == 'BLUE') {
    diff = Date.DateDiff('d', RECYCLEBLUESTART, Date.today()) % 14;
  } else {
    diff = Date.DateDiff('d', RECYCLEYELLOWSTART, Date.today()) % 14;
  }
  if (diff < 7 && Date.parse(trashDay).compareTo(Date.today()) == 0) {
    return this.formatDate(Date.parse(Date.today()));
  } else if ((diff < 7 && (Date.parse(trashDay).compareTo(Date.today()) <= -1) || (diff >= 7 && Date.parse(trashDay).compareTo(Date.today()) >= 1))) {
    return this.formatDate(Date.parse('next ' + trashDay).next().week());
  } else {
    return this.formatDate(Date.parse('next ' + trashDay));
  }
};

getCircleCoords(x,y,d) {
  var tao = 2 * Math.PI;
  var results = [];
  var pointsInCircle = 8
  //convert lat and long to radians
  x = x * (Math.PI / 180);
  y = y * (Math.PI / 180);
  for (var i = 0;i <= pointsInCircle; i ++) {
    var lat = Math.asin(Math.sin(y) * Math.cos(d) + Math.cos(y) * Math.sin(d) * Math.cos((i / pointsInCircle) * tao));
    var long = ((x + Math.asin(Math.sin((i / pointsInCircle) * tao) * Math.sin(d) / Math.cos(lat)) + Math.PI) % (tao)) - Math.PI;
    results.push("[" + (long / (Math.PI / 180)).toString() + "," + (lat / (Math.PI / 180)).toString() + "]");
  }
  return results;
};

addLeadZeros(caseNumber, caseNumberLength) {
  var filler = '0';
  var results = filler.repeat(caseNumberLength - caseNumber.length).concat(caseNumber);
  return results.valueOf();
};

addCaseAction(caseSubject){
  if(caseSubject !== undefined){
    return CASESUBJECTPAIRINGS[caseSubject.toUpperCase()];
  } else {
    return caseSubject;
  }
};

addFieldResults(body, results) {
  var lines = body.toString().split("\n");
  for (var i = 1; i < lines.length; i++) {
    var fieldInfo = lines[i].split("\t");
    if (fieldInfo.length > 1) {
      var parkName = this.FIELDNAMEPAIRINGS[fieldInfo[0].toUpperCase()] || fieldInfo[0].toUpperCase();
      var fieldName = fieldInfo[1];
      if (results[parkName] === undefined) {
        results[parkName] = {open: [], closed: []};
      }
      if (fieldInfo[2].toString().match(/(cancel|close)/i) === null) {
        results[parkName].open.push(fieldName);
      } else {
        results[parkName].closed.push(fieldName);
      }
    }
  }
  return results;
};

//next two functions are from Amazon's calendar reader on github used to parse the Amazon.Date slot type.
getWeekendData(res) {
    if (res.length === 3) {
        var saturdayIndex = 5;
        var sundayIndex = 6;
        var weekNumber = res[1].substring(1);

        var weekStart = w2date(res[0], weekNumber, saturdayIndex);
        var weekEnd = w2date(res[0], weekNumber, sundayIndex);

        return Dates = {
            startDate: weekStart,
            endDate: weekEnd,
        };
    }
}

getPrepostion(len) {
  return len > 1 ? 'are' : 'is';
}

w2date(year, wn, dayNb) {
    var day = 86400000;

    var j10 = new Date(year, 0, 10, 12, 0, 0),
        j4 = new Date(year, 0, 4, 12, 0, 0),
        mon1 = j4.getTime() - j10.getDay() * day;
    return new Date(mon1 + ((wn - 1) * 7 + dayNb) * day);
};

}
module.exports = HelperClass;
