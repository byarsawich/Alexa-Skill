'use strict';
module.change_code = 1;
process.env.TZ = 'America/New_York';
var _ = require('lodash');
var Alexa = require('alexa-sdk');
var OpenDataHelper = require('./open_data_helper');
var EsriDataHelper = require('./esri_data_helper');
var SalesforceHelper = require('./salesforce_helper');
var FieldStatusHelper = require('./field_status_helper');
var HelperClass = require('./helper_functions.js');
var ua = require('universal-analytics');
require('./jsDate.js')();
var facts = require('./cary_facts');
var ESRIENDPOINT = 'https://maps.townofcary.org/arcgis1/rest/services/';
var ARCGISENDPOINT = 'https://services2.arcgis.com/l4TwMwwoiuEVRPw9/ArcGIS/rest/services/';
var OPENDATAENDPOINT = 'https://data.townofcary.org/api/records/1.0/search/?';
var EVENTDATAENDPOINT = 'http://www.townofcary.org/API'; // still waiting on vision to get this set properly
var EVENTLOCATIONENDPOINT = 'http://www.townofcary.org/API'; // location based on evendata ID
var RSSFEEDENDPOINT = 'http://www.townofcary.org/Home/Components/RssFeeds/RssFeed/View?ctID=5&cateIDs=1%2c2%2c3%2c4%2c5%2c6%2c10%2c11%2c12%2c13%2c14%2c15%2c16%2c17%2c18%2c19%2c20%2c21%2c22%2c53%2c54%2c55%2c59%2c64';
var DISTANCE = 1; //distance for radius search.  currently 1 mile can be adapted later.
var APP_ID = process.env.ALEXAAPPID;  // TODO replace with your app ID (OPTIONAL).
var CASENUMBERLENGTH = 8; //the current number of digits in a case number to add leading zeros
//If false, it means that Account Linking isn't mandatory there fore we dont have accaes to the account of the community user so we will ask for the user's Phone Number.
// IMPORTANT!! Make sure that the profile of the community user has the 'API Enabled' field marked as true.
var ACCOUNT_LINKING_REQUIRED = true;
var APP_STATES = {
  COUNCIL: '_COUNCIL', // Asking for users address
  PARKS: '_PARKS',
  HELP: '_HELPMODE',
  ART: '_ART',
  CASE: '_CASE',
  TRASH: '_TRASH'
};

var welcomeMessage = 'Welcome to the Town of Cary Alexa skill.  If you need help with your options please say help. What can I help you with today?';
var welcomeReprompt = 'If you need help with your options please say help.  What can I do for you today?';

var helpMessage = 'To report a case to the town you can say something like I need help with leaf collection or I need help with missed trash.  For information you can ask for open gym times for a date, what parks are nearby, who is your council member or a fact about cary.  For a full list please check the card sent to your alexa app. What can I help you with today?';
var helpMessageReprompt = 'What can I help you with today?';
var helpMesssageCard = 'Sample questions:\nCases: What is my case status?\nWhat is the status of case {case number}?\nI need to create a case.\nI need help with {case issue}\nInformation: Tell me a fact about Cary.\nWho is my council member?\nWho is on the city council?\nWho is the mayor?\nWhat are the open gym times for {day}\nWhat parks are nearby?\nWhat public art is nearby?';

var CASEISSUES = ['Broken Recycling', 'Broken Trash', 'Cardboard Collection', 'Leaf Collection', 'Missed Recycling', 'Missed Trash', 'Missed Yard Waste', 'Oil Collection', 'Upgrade Recycling', 'Upgrade Trash'];
var GYMLOCATIONS = {'bond park': 'BPCC', 'herbert young': 'HYCC', 'herb young': 'HYCC', 'herbert c. young': 'HYCC', 'middle creek': 'MCCC', 'cary arts': 'CAC', 'cary arts center': 'CAC'};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;

  alexa.registerHandlers(newSessionHandlers, councilHandlers, parkHandlers, artHandlers, caseHandlers, trashHandlers);
  alexa.execute();
};

var newSessionHandlers = {
  'LaunchRequest': function () {
    var intentTrackingID = ua('UA-96121814-2');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(this.event.request.intent.slots) + " Attributes: " + JSON.stringify(this.attributes)).send();
    this.emit(':ask', welcomeMessage, welcomeReprompt);
  },

  'OpenGymTimesIntent': function () {
    var intentTrackingID = ua('UA-96121814-3');
    var gymTimeDate = this.event.request.intent.slots.Date.value || Date.yyyymmdd(Date.today());
    var location = this.event.request.intent.slots.location.value;
    var prompt = '';
    if(gymTimeDate.search(/^\d{4}-\d{2}-\d{2}$/) == -1){
      prompt = 'Please choose a single day for open gym times.';
      intentTrackingID.event("Wrong Input","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':ask', prompt);
      return;
    }
    var openDataHelper = new OpenDataHelper();
    var self = this;
    var q = '';
    if(location === undefined){
      q = 'open_gym_start==' + gymTimeDate;
    } else {
      q = 'open_gym_start==' + gymTimeDate + ' AND community_center==' + GYMLOCATIONS[location];
    }
    var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=' + q + '&facet=facility_title&facet=pass_type&facet=community_center&facet=open_gym&facet=group&facet=date_scanned&timezone=UTC';
    openDataHelper.requestOpenData(uri).then(function(gymTimeStatus) {
      console.log(gymTimeStatus.records);
      return openDataHelper.formatGymTimes(gymTimeStatus);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err) {
      prompt = 'I didn\'t have data for gym times on ' + gymTimeDate;
      console.log(err);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'GetCaryFactsIntent': function () {
    var intentTrackingID = ua('UA-96121814-4');
    var index = Math.floor(Math.random() * facts['facts'].length);
    var prompt = facts['facts'][index];
    intentTrackingID.event("Success","Slots: " + JSON.stringify(this.event.request.intent.slots) + " Attributes: " + JSON.stringify(this.attributes)).send();
    this.emit(':tell', prompt);
  },

  'MyCouncilMemberIntent': function() {
    getUserAddress(this.event.session.user.accessToken, APP_STATES.COUNCIL, 'GetCouncilInfoIntent', this);
  },

  'NearbyParksIntent': function() {
    getUserAddress(this.event.session.user.accessToken, APP_STATES.PARKS, 'GetParkInfoIntent', this);
  },

  'NearbyPublicArtIntent': function() {
    getUserAddress(this.event.session.user.accessToken, APP_STATES.ART, 'GetPublicArtInfoIntent', this);
  },

  'TrashDayIntent': function(){
    getUserAddress(this.event.session.user.accessToken, APP_STATES.TRASH, 'GetTrashDayIntent', this);
  },

  'AllCouncilMembersIntent': function() {
    var intentTrackingID = ua('UA-96121814-5');
    var prompt = '';
    var self = this;
    var openDataHelper = new OpenDataHelper();
    var uri = OPENDATAENDPOINT + 'dataset=council-districts&q=county==wake&sort=name&facet=at_large_representatives';
    openDataHelper.requestOpenData(uri).then(function(response) {
       return openDataHelper.formatAllCouncilMembers(response);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err) {
      prompt = 'There seems to be a problem with the connection right now.  Please try again later';
      console.log(err);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'AtLargeCouncilMembersIntent': function() {
    var intentTrackingID = ua('UA-96121814-6');
    var prompt = '';
    var self = this;
    var openDataHelper = new OpenDataHelper();
    var uri = OPENDATAENDPOINT + 'dataset=council-districts&q=county==wake&sort=name&facet=at_large_representatives';
    openDataHelper.requestOpenData(uri).then(function(response) {
       return openDataHelper.formatAtLargeCouncilMembers(response);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err) {
      prompt = 'There seems to be a problem with the connection right now.  Please try again later';
      console.log(err);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'MyMayorIntent': function() {
    var intentTrackingID = ua('UA-96121814-7');
    var prompt = '';
    var self = this;
    var openDataHelper = new OpenDataHelper();
    var uri = OPENDATAENDPOINT + 'dataset=council-districts&q=county==wake&sort=name&facet=at_large_representatives';
    openDataHelper.requestOpenData(uri).then(function(response) {
       return openDataHelper.formatMayor(response);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err) {
      prompt = 'There seems to be a problem with the connection right now.  Please try again later';
      console.log(err);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'CaseStartIntent': function() {
    var intentTrackingID = ua('UA-96121814-8');
    if(ACCOUNT_LINKING_REQUIRED == true && this.event.session.user.accessToken == undefined) {
  		var speechOutput = "You must link your account before accessing this skill.";
      intentTrackingID.event("Account Not Linked","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
  		this.emit(':tellWithLinkAccountCard', speechOutput);
  	} else {
      var prompt = "OK, let's create a new Case. What do you need help with?";
      var reprompt = 'For a list of options please say help.  What do you need help with?';
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.handler.state = APP_STATES.CASE;
      this.emit(':ask', prompt, reprompt);
    }
  },

  'CaseConfirmationIntent': function() {
    var intentTrackingID = ua('UA-96121814-9');
    var helperClass = new HelperClass();
    if(ACCOUNT_LINKING_REQUIRED == true && this.event.session.user.accessToken == undefined) {
  		var speechOutput = "You must link your account before accessing this skill.";
      intentTrackingID.event("Account Not Linked","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
  		this.emit(':tellWithLinkAccountCard', speechOutput);
  	} else {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      var caseSubject = helperClass.formatCaseSubject(this.event.request.intent.slots.caseSubject.value);
      var caseAction = this.event.request.intent.slots.caseAction.value || helperClass.addCaseAction(caseSubject);
      this.attributes['caseIssue'] = CASEISSUES.find(checkCaseIssue, {"caseSubject": caseSubject, "caseAction": caseAction}) || CASEISSUES.find(checkCaseIssue, {"caseSubject": caseSubject, "caseAction": helperClass.addCaseAction(caseSubject)});
      this.handler.state = APP_STATES.CASE;
      this.emitWithState('CaseConfirmationIntent', true);
    }
  },

  'MyCaseStatusIntent': function() {
    var intentTrackingID = ua('UA-96121814-10');
    var helperClass = new HelperClass();
    if(ACCOUNT_LINKING_REQUIRED == true && this.event.session.user.accessToken == undefined) {
  		var speechOutput = "You must link your account before accessing this skill.";
      intentTrackingID.event("Account Not Linked","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
  		this.emit(':tellWithLinkAccountCard', speechOutput);
  	} else {
      var salesforceHelper = new SalesforceHelper();
      var userToken = this.event.session.user.accessToken;
      var caseSubject = helperClass.formatCaseSubject(this.event.request.intent.slots.caseSubject.value);
      var caseAction = this.event.request.intent.slots.caseAction.value || helperClass.addCaseAction(caseSubject);
      var prompt = '';
      var self = this;
      salesforceHelper.findLatestCaseStatus(userToken, CASEISSUES.find(checkCaseIssue, {"caseSubject": caseSubject, "caseAction": caseAction})).then(function(response) {
        console.log(response);
        return salesforceHelper.formatExistingCase(response);
      }).then(function(response) {
        intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
        self.emit(':tellWithCard', response.prompt, 'Town of Cary Case', response.card);
      }).catch(function(err){
        prompt = 'There seems to be a problem with the connection right now.  Please try again later';
        console.log(err);
        intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
        self.emit(':tell', prompt);
      });
    }
  },

  'CaseStatusIntent': function() {
    var intentTrackingID = ua('UA-96121814-11');
    if(ACCOUNT_LINKING_REQUIRED == true && this.event.session.user.accessToken == undefined) {
  		var speechOutput = "You must link your account before accessing this skill.";
      intentTrackingID.event("Account Not Linked","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
  		this.emit(':tellWithLinkAccountCard', speechOutput);
  	} else {
      var helperClass = new HelperClass();
      var salesforceHelper = new SalesforceHelper();
      var userToken = this.event.session.user.accessToken;
      var caseNumber = this.event.request.intent.slots.CaseNumber.value;
      if(caseNumber.length < CASENUMBERLENGTH){
        caseNumber = helperClass.addLeadZeros(caseNumber, CASENUMBERLENGTH);
      }
      var prompt = '';
      var self = this;
      salesforceHelper.findCaseStatus(userToken, caseNumber).then(function(response) {
        console.log(response)
        if(response.length <= 0){
          intentTrackingID.event("Wrong Input","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
          self.emit(':tell', 'I could not find a case with that number on your account.  Please double check your case number.');
        }
        return salesforceHelper.formatExistingCase(response);
      }).then(function(response) {
        intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
        self.emit(':tellWithCard', response.prompt, 'Town of Cary Case', response.card);
      }).catch(function(err){
        prompt = 'There seems to be a problem with the connection right now.  Please try again later';
        console.log(err);
        intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
        self.emit(':tell', prompt);
      });
    }
  },

  'TownHallHoursIntent': function(){
    var intentTrackingID = ua('UA-96121814-12');
    var userToken = this.event.session.user.accessToken;
    var salesforceHelper = new SalesforceHelper();
    var date = this.event.request.intent.slots.Date.value || Date.yyyymmdd(Date.today());
    if(date.search(/^\d{4}-\d{2}-\d{2}$/) == -1){
      var prompt = 'Please choose a single day for town hall hours.';
      intentTrackingID.event("Wrong Input","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':ask', prompt);
      return;
    }
    var self = this;
    salesforceHelper.getTownHallHours(userToken, date).then(function(response){
      return salesforceHelper.formatTownHallHours(response, date);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err){
      prompt = 'There seems to be a problem with the connection right now.  Please try again later';
      console.log(err);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },


  'UpcomingCaryEventsIntent': function() {
    var intentTrackingID = ua('UA-96121814-13');
    var prompt = '';
    var date = this.event.request.intent.slots.Date.value || Date.yyyymmdd(Date.today());
    if(date.search(/^\d{4}-\d{2}-\d{2}$/) == -1){
      var prompt = 'Please choose a single day for a list of events.';
      intentTrackingID.event("Wrong Input","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':ask', prompt);
      return;
    }
    // var self = this;
    var startDate = date + 'T00:00:00';
    var endDate = date + 'T23:59:59';

    var locationuri = EVENTLOCATIONENDPOINT // waiting on vision...
    var uri = EVENTDATAENDPOINT //continue building out query string once vision gets back to us
  },

  'FieldStatusIntent': function() {
    var intentTrackingID = ua('UA-96121814-14');
    var helperClass = new HelperClass();
    var parkName = this.event.request.intent.slots.park.value;
    var prompt = '';
    if(helperClass.FIELDNAMEPAIRINGS[parkname] === undefined){
      prompt = 'I\'m sorry I did not recognize that field name.';
      intentTrackingID.event("Wrong Input","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':tell', prompt);
    }
    var fieldStatusHelper = new FieldStatusHelper();
    var self = this;
    fieldStatusHelper.getAllFieldStatus().then(function(response){
      return fieldStatusHelper.formatFieldStatus(response, parkName);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(err){
      console.log(err);
      prompt = 'I\'m sorry, there seems to be a problem with the connection right now.';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'AMAZON.RepeatIntent': function () {
      var intentTrackingID = ua('UA-96121814-15');
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptText']);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96121814-16');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      this.emit(':askWithCard', helpMessage, helpMessageReprompt, 'Town of Cary Help Index', helpMesssageCard);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96121814-17');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96121814-18');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96121814-19');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat the question.';
    this.emit(':ask', prompt, prompt);
  },

  'RSSFeedIntent': function() {
    var intentTrackingID = ua('UA-96121814-20');
    var prompt = '';

    var rssFeedHelper = new rssFeedHelper();
    var self = this;

    return rssFeedHelper.requestRSSFeed().then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.Stringify(self.attributes)).sent();
      self.emit(':tell', response);
    });
  }
};

var councilHandlers = Alexa.CreateStateHandler(APP_STATES.COUNCIL, {

  'GetByAddressIntent': function() {
    var intentTrackingID = ua('UA-96187564-1');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var street_number = this.event.request.intent.slots.street_number.value;
    var street = this.event.request.intent.slots.street.value;
    var address = street_number + ' ' + street
    var prompt = '';
    esriDataHelper.requestAddressInformation(address).then(function(response) {
      var uri = ESRIENDPOINT + 'Elections/Elections/MapServer/identify?geometry=' + response.candidates[0].location.x + ',' + response.candidates[0].location.y + '&geometryType=esriGeometryPoint&sr=4326&layers=all&layerDefs=&time=&layerTimeOptions=&tolerance=2&mapExtent=-79.193,35.541,-78.63,35.989&imageDisplay=600+550+96&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson';
      return esriDataHelper.requestESRIInformation(uri);
    }).then(function(response){
      return esriDataHelper.formatMyCouncilMember(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      prompt = 'I could not find any information for ' + address;
      console.log(error);
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'GetCouncilInfoIntent': function() {
    var intentTrackingID = ua('UA-96187564-2');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var address = this.attributes['address'];
    var uri = ESRIENDPOINT + 'Elections/Elections/MapServer/identify?geometry=' + address.x + ',' + address.y + '&geometryType=esriGeometryPoint&sr=4326&layers=all&layerDefs=&time=&layerTimeOptions=&tolerance=2&mapExtent=-79.193,35.541,-78.63,35.989&imageDisplay=600+550+96&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson';
    esriDataHelper.requestESRIInformation(uri).then(function(response){
      return esriDataHelper.formatMyCouncilMember(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      console.log(error);
      var prompt = 'I could not find any information at your location.  Would you like to try another address?';
      var reprompt = 'Would you like to try searching at another address?';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':ask', prompt, reprompt);
    });
  },

  'AMAZON.YesIntnet': function() {
    var intentTrackingID = ua('UA-96187564-3');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me an address so I can look up your council information';
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.NoIntent': function() {
    var intentTrackingID = ua('UA-96187564-4');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'OK, Have a nice day';
    this.emit(':tell', prompt);
  },

  'AMAZON.RepeatIntent': function () {
    var intentTrackingID = ua('UA-96187564-5');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptText']);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96187564-6');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me your house number and street for me to look up your council information.'
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96187564-7');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96187564-8');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96187564-9');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat that.';
    this.emit(':ask', prompt, prompt);
  }
});

var parkHandlers = Alexa.CreateStateHandler(APP_STATES.PARKS, {

  'GetByAddressIntent': function() {
    var intentTrackingID = ua('UA-96098494-1');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var reprompt = 'Please tell me your address so I can look up nearby parks.';
    var street_number = this.event.request.intent.slots.street_number.value;
    var street = this.event.request.intent.slots.street.value;
    var address = street_number + ' ' + street
    var prompt = '';
    esriDataHelper.requestAddressInformation(address).then(function(response) {
      var uri = ESRIENDPOINT + 'ParksRec/Parks/FeatureServer/0/query';
      return esriDataHelper.requestInformationByRadius(response.candidates[0].location.x, response.candidates[0].location.y, DISTANCE, uri);
    }).then(function(response){
        return esriDataHelper.formatNearbyParks(response);
    }).then(function(responseresponse) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      prompt = 'I could not find any parks near ' + address;
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'GetParkInfoIntent': function() {
    var intentTrackingID = ua('UA-96098494-2');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var address = this.attributes['address'];
    esriDataHelper.requestAddressInformation(address).then(function(response) {
      var uri = ESRIENDPOINT + 'ParksRec/Parks/FeatureServer/0/query';
      return esriDataHelper.requestInformationByRadius(address.x, address.y, DISTANCE, uri)
    }).then(function(response){
      return esriDataHelper.formatNearbyParks(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      console.log(error);
      var prompt = 'I could not find any parks near your location.  Would you like to try another address?';
      var reprompt = 'Would you like to try searching at another address?';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':ask', prompt, reprompt);
    });
  },

  'AMAZON.YesIntnet': function() {
    var intentTrackingID = ua('UA-96098494-3');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me an address so I can look up nearby parks';
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.NoIntent': function() {
    var intentTrackingID = ua('UA-96098494-4');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'OK, Have a nice day';
    this.emit(':tell', prompt);
  },

  'AMAZON.RepeatIntent': function () {
    var intentTrackingID = ua('UA-96098494-5');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptText']);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96098494-6');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me a house number and street for me to look up nearby parks.'
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96098494-7');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96098494-8');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96098494-9');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat that.';
    this.emit(':ask', prompt, prompt);
  }
});

var artHandlers = Alexa.CreateStateHandler(APP_STATES.ART, {

  'GetByAddressIntent': function() {
    var intentTrackingID = ua('UA-96124235-1');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var reprompt = 'Please tell me your address so I can look up nearby public art.';
    var street_number = this.event.request.intent.slots.street_number.value;
    var street = this.event.request.intent.slots.street.value;
    var address = street_number + ' ' + street
    var prompt = '';
    esriDataHelper.requestAddressInformation(address).then(function(response) {
        var uri = ARCGISENDPOINT + 'Art_in_Public_Places/FeatureServer/0/query?where=&objectIds=&time=&geometry=' + response.candidates[0].location.x + ',' + response.candidates[0].location.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=1000&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson';
      return esriDataHelper.requestESRIInformation(uri);
    }).then(function(response){
      return esriDataHelper.formatNearbyPublicArt(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      prompt = 'I could not find any public art near ' + address;
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'GetPublicArtInfoIntent': function() {
    var intentTrackingID = ua('UA-96124235-2');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var address = this.attributes['address'];
    var prompt = '';
    var uri = ARCGISENDPOINT + 'Art_in_Public_Places/FeatureServer/0/query?where=&objectIds=&time=&geometry=' + address.x + ',' + address.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=1000&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson';
    esriDataHelper.requestESRIInformation(uri).then(function(response){
      return esriDataHelper.formatNearbyPublicArt(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      console.log(error);
      var prompt = 'I could not find any public art near your location.  Would you like to try another address?';
      var reprompt = 'Would you like to try searching at another address?';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':ask', prompt, reprompt);
    });
  },

  'AMAZON.YesIntnet': function() {
    var intentTrackingID = ua('UA-96124235-3');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me an address so I can look up nearby public art';
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.NoIntent': function() {
    var intentTrackingID = ua('UA-96124235-4');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'OK, Have a nice day';
    this.emit(':tell', prompt);
  },

  'AMAZON.RepeatIntent': function () {
    var intentTrackingID = ua('UA-96124235-5');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptText']);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96124235-6');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me your house number and street for me to look up nearby public art.'
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96124235-7');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96124235-8');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96124235-9');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat the question.';
    this.emit(':ask', prompt, prompt);
  }
});

var caseHandlers = Alexa.CreateStateHandler(APP_STATES.CASE, {
  'CreateCaseIntent': function () {
    var intentTrackingID = ua('UA-96098495-1');
    var userToken = this.event.session.user.accessToken;
    var salesforceHelper = new SalesforceHelper();
    var caseIssue =  this.attributes["caseIssue"];
    var prompt = '';
    var self = this;
    salesforceHelper.createCaseInSalesforce(userToken, caseIssue).then(function(response){
      self.attributes['case'] = response;
      self.attributes['caseIssue'] = response.CaseIssue__r.Name;
      return salesforceHelper.formatNewCaseStatus(response);
    }).then(function(response){
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':askWithCard', response.prompt, response.prompt, 'Town of Cary Case', response.card);
    }).catch(function(err) {
      prompt = 'Darn, there was a Salesforce problem, sorry';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      console.log(err);
      self.emit(':tell', prompt);
    });
  },

  'CaseConfirmationIntent': function () {
    var intentTrackingID = ua('UA-96098495-2');
    var helperClass = new HelperClass();
    var caseIssue = this.attributes["caseIssue"];
    if(caseIssue === undefined){
      var caseSubject = helperClass.formatCaseSubject(this.event.request.intent.slots.caseSubject.value);
      var caseAction = this.event.request.intent.slots.caseAction.value || helperClass.addCaseAction(caseSubject);
      this.attributes['caseIssue'] = CASEISSUES.find(checkCaseIssue, {"caseSubject": caseSubject, "caseAction": caseAction});
      caseIssue = this.attributes["caseIssue"];
    }
    var prompt = _.template('You wish to create a new case for ${caseIssue}.  Is that correct?')({
      caseIssue: caseIssue
    });
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.YesIntent': function() {
    var intentTrackingID = ua('UA-96098495-3');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    //I'm not sure if the attributes will be maintaned between Intents so reassigning it just incase.
    this.attributes["caseIssue"] = this.attributes["caseIssue"];
    this.emitWithState('CreateCaseIntent', true);
  },

  'AMAZON.NoIntent': function() {
    var intentTrackingID = ua('UA-96098495-4');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.attributes = {};
    var prompt = 'Ok, what typt of case would you like to submit?'
    var reprompt = 'For a list of options please say help.  What do you need help with?';
    this.emit(':ask', prompt, reprompt);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96098495-5');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'To create a new case you can say I need help with a problem.  For a full list of current cases please check the card in your alexa app.  What can I help you with today?';
    var reprompt = 'What can I help you with today?';
    var cardMessage = 'Current case types you can submit to the Town of Cary:\nBroken Recycling Cart\nBroken Trash Cart\nCardboard Collection\nLeaf Collection\nMissed Recycling\nMissed Trash\nMissed Yard Waste\nOil Collection\nUpgrade Recycling Cart\nUpgrade Trash Cart';
    this.emit(':askWithCard', prompt, prompt, 'Town of Cary Case Help', cardMessage);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96098495-6');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96098495-7');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96098495-8');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat your problem.';
    this.emit(':ask', prompt, prompt);
  }
});

var trashHandlers = Alexa.CreateStateHandler(APP_STATES.TRASH, {

  'GetByAddressIntent': function() {
    var intentTrackingID = ua('UA-96121926-1');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var reprompt = 'Please tell me your address so I can look up nearby public art.';
    var street_number = this.event.request.intent.slots.street_number.value;
    var street = this.event.request.intent.slots.street.value;
    var address = street_number + ' ' + street
    esriDataHelper.requestAddressInformation(address).then(function(response) {
        var uri = ESRIENDPOINT + 'PublicWorks/Public_Works_Operations/MapServer/0/query?where=&text=&objectIds=&time=&geometry=' + response.candidates[0].location.x + ',' + response.candidates[0].location.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson'
      return esriDataHelper.requestESRIInformation(uri);
    }).then(function(response){
      return esriDataHelper.formatMyTrashDay(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      var prompt = 'I could not find any information for ' + address;
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', prompt);
    });
  },

  'GetTrashDayIntent': function() {
    var intentTrackingID = ua('UA-96121926-2');
    var esriDataHelper = new EsriDataHelper();
    var self = this;
    var address = this.attributes['address'];
    var uri = ESRIENDPOINT + 'PublicWorks/Public_Works_Operations/MapServer/0/query?where=&text=&objectIds=&time=&geometry=' + address.x + ',' + address.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson'
    esriDataHelper.requestESRIInformation(uri).then(function(response){
      return esriDataHelper.formatMyTrashDay(response);
    }).then(function(response) {
      intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':tell', response);
    }).catch(function(error){
      console.log(error);
      var prompt = 'I could not find any information about your location.  Would you like to try another address?';
      var reprompt = 'Would you like to try searching at another address?';
      intentTrackingID.event("Failure","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
      self.emit(':ask', prompt, reprompt);
    });
  },

  'AMAZON.YesIntnet': function() {
    var intentTrackingID = ua('UA-96121926-3');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me an address so I can look up your next trash and recycle day.';
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.NoIntent': function() {
    var intentTrackingID = ua('UA-96121926-4');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'OK, Have a nice day';
    this.emit(':tell', prompt);
  },

  'AMAZON.RepeatIntent': function () {
    var intentTrackingID = ua('UA-96121926-5');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptText']);
  },

  'AMAZON.HelpIntent': function() {
    var intentTrackingID = ua('UA-96121926-6');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'Please tell me your house number and street for me to look your next trash and recycle day.'
    this.emit(':ask', prompt, prompt);
  },

  'AMAZON.StopIntent': function () {
    var intentTrackingID = ua('UA-96121926-7');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.CancelIntent': function () {
    var intentTrackingID = ua('UA-96121926-8');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    this.emit(':tell', 'Goodbye');
  },

  'Unhandled': function () {
    var intentTrackingID = ua('UA-96121926-9');
    intentTrackingID.event("Success","Slots: " + JSON.stringify(self.event.request.intent.slots) + " Attributes: " + JSON.stringify(self.attributes)).send();
    var prompt = 'I\'m sorry.  I didn\'t catch that.  Can you please repeat the question.';
    this.emit(':ask', prompt, prompt);
  }
});

function getUserAddress(userToken, state, intent, self){
  var salesforceHelper = new SalesforceHelper();
  salesforceHelper.getUserAddress(userToken).then(function(results){
    self.attributes["address"] = results;
    console.log(results);
    console.log(self.attributes["address"]);
    if(results.x != null && results.y != null) {
      self.handler.state = state;
      self.emitWithState(intent, true);
    }
  }).catch(function(err) {
    console.log(err);
  }).finally(function(){
    if(self.attributes["address"] == undefined || self.attributes["address"] == null){
      self.handler.state = state;
      var prompt = 'Please tell me your address so I can look up your requested information';
      self.emit(':ask', prompt, prompt);
    }
  });
}

function checkCaseIssue(caseIssue){
  if(this.caseAction === undefined || this.caseSubject === undefined){
    return false;
  }
  return (caseIssue.toUpperCase() == this.caseSubject.toUpperCase() + ' ' + this.caseAction.toUpperCase()) || (caseIssue.toUpperCase() == this.caseAction.toUpperCase() + ' ' + this.caseSubject.toUpperCase());
}
