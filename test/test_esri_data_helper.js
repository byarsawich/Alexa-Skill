'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var EsriDataHelper = require('../esri_data_helper');
var ESRIENDPOINT = 'https://maps.townofcary.org/arcgis1/rest/services/';
var ARCGISENDPOINT = 'http://services2.arcgis.com/l4TwMwwoiuEVRPw9/ArcGIS/rest/services/';
chai.config.includeStack = true;

describe('EsriDataHelper', function() {
  var subject = new EsriDataHelper();
  describe('#getMyCouncilInformation', function(){
    var x = '-78.78019524861178';
    var y = '35.789212829037126';
    var address = '316 N Academy St';
    context('with a geolocation', function(){
      it('returns council representative and district from Lat Long', function(){
        var uri = ESRIENDPOINT + 'Elections/Elections/MapServer/identify?geometry=' + x + ',' + y + '&geometryType=esriGeometryPoint&sr=4326&layers=all&layerDefs=&time=&layerTimeOptions=&tolerance=2&mapExtent=-79.193,35.541,-78.63,35.989&imageDisplay=600+550+96&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson'
        return subject.requestESRIInformation(uri).then(function(obj){
          expect(obj.results[1].attributes["Representative Name"]).to.equal("Don Frantz");
        });
      });
    });
    context('with an address', function() {
      it('gets geolocation from ESRI and then gets council information', function() {
        var value = subject.requestAddressInformation(address).then(function(obj){
          var uri = ESRIENDPOINT + 'Elections/Elections/MapServer/identify?geometry=' + obj.candidates[0].location.x + ',' + obj.candidates[0].location.y + '&geometryType=esriGeometryPoint&sr=4326&layers=all&layerDefs=&time=&layerTimeOptions=&tolerance=2&mapExtent=-79.193,35.541,-78.63,35.989&imageDisplay=600+550+96&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&f=pjson'
          return subject.requestESRIInformation(uri).then(function(obj){
            expect(obj.results[1].attributes["Representative Name"]).to.equal("Don Frantz");
          });
        });
      });
    });
  });
  describe('#getNearbyParks', function(){
    var x = '-78.78019524861178';
    var y = '35.789212829037126';
    var address = '316 N Academy St';
    var DISTANCE = 1;
    var uri = ESRIENDPOINT + 'ParksRec/Parks/FeatureServer/0/query';
    context('with a geolocation', function(){
      it('returns all parks in 1 mile radius from Lat Long', function(){
        return subject.requestInformationByRadius(x,y, DISTANCE, uri).then(function(obj){
          expect(obj.features[0].attributes["NAME"]).to.eq("Heater Park");
        });
      });
    });
    context('with an address', function() {
      it('gets geolocation from ESRI and then gets all parks in 1 mile radius', function() {
        return subject.requestAddressInformation(address).then(function(obj){
          return subject.requestInformationByRadius(obj.candidates[0].location.x, obj.candidates[0].location.y, DISTANCE, uri).then(function(obj){
            expect(obj.features[0].attributes["NAME"]).to.eq("Heater Park");
          });
        });
      });
    });
  });
  /*data set has gone missing for now.
  describe('#getNearbyPublicArt', function(){
    var x = '-78.78019524861178';
    var y = '35.789212829037126';
    var address = '316 N Academy St';
    context('with a geolocation', function(){
      it('returns all public art in 1km radius from Lat Long', function(){
        var uri = ARCGISENDPOINT + 'Art_in_Public_Places/FeatureServer/0/query?where=&objectIds=&time=&geometry=' + x + ',' + y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=1000&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson';
        var value = subject.requestESRIInformation(uri).then(function(obj){
          return obj.features[0].attributes["Name"];
        });
        return expect(value).to.eventually.eq("Join the Parade");
      });
    });
    context('with an address', function() {
      it('gets geolocation from ESRI and then gets all public art in 1km radius', function() {
        var value = subject.requestAddressInformation(address).then(function(obj){
          var uri = ARCGISENDPOINT + 'Art_in_Public_Places/FeatureServer/0/query?where=&objectIds=&time=&geometry=' + obj.candidates[0].location.x + ',' + obj.candidates[0].location.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=1000&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson';
          return subject.requestESRIInformation(uri).then(function(obj){
            return obj.features[0].attributes["Name"];
          });
        });
        return expect(value).to.eventually.eq("Join the Parade");
      });
    });
  });*/
  describe('#getTrashCollectionInfo', function(){
    var x = '-78.78005';
    var y = '35.78225';
    var address = '413 Kildaire Farm Rd';
    context('with a geolocation', function(){
      it('returns next trash and recycle day', function(){
        var uri = ESRIENDPOINT + 'PublicWorks/Public_Works_Operations/MapServer/0/query?where=&text=&objectIds=&time=&geometry=' + x + ',' + y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson'
        return subject.requestESRIInformation(uri).then(function(obj){
          expect(obj.features[0].attributes["Day"]).to.eq("Wed");
        });
      });
    });
    context('with an address', function() {
      it('gets geolocation from ESRI and then gets next trash and recycle day', function() {
        var value = subject.requestAddressInformation(address).then(function(obj){
          var uri = ESRIENDPOINT + 'PublicWorks/Public_Works_Operations/MapServer/0/query?where=&geometry=' + obj.candidates[0].location.x + ',' + obj.candidates[0].location.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson'
          return subject.requestESRIInformation(uri)
        }).then(function(obj){
          expect(obj.features[0].attributes["Day"]).to.eq("Wed");
        });
      });
      it('Calls the esri helper to get formated trash day', function() {
        var value = subject.requestAddressInformation(address).then(function(obj){
          var uri = ESRIENDPOINT + 'PublicWorks/Public_Works_Operations/MapServer/0/query?where=&geometry=' + obj.candidates[0].location.x + ',' + obj.candidates[0].location.y + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=pjson'
          return subject.requestESRIInformation(uri)
        }).then(function(obj){
          return subject.formatMyTrashDay(obj)
        }).then(function(obj){
          console.log(obj);
        });
      });
    });
  });
  describe('#formatMyCouncilMember', function() {
    var status = {
        "results": [
          {
            "layerId": 0,
            "layerName": "Polling Places",
            "displayFieldName": "Polling Location",
            "value": "Herbert C. Young Community Center",
            "attributes": {
              "OBJECTID": "17",
              "Polling Location": "Herbert C. Young Community Center",
              "Polling Place ID": "04-11",
              "Full Site Address": "101 Wilkinson Ave",
              "City": "Cary",
              "State": "NC",
              "Polling Hours": "Null",
              "Handicap Accessible": "Yes",
              "Next Election Date": "11/8/2016",
              "Voter Registration Deadline": "Null",
              "Contact Name": "Wake County Board of Elections",
              "Phone": "919-856-6240",
              "Email": "voter@wakegov.com",
              "Last Update Date": "Null",
              "Last Editor": "Null",
              "Shape": "Point"
            }
          },
          {
            "layerId": 2,
            "layerName": "Town of Cary Council",
            "displayFieldName": "Council Distict",
            "value": "B",
            "attributes": {
              "OBJECTID": "2861",
              "District ID": "B",
              "Council Distict": "B",
              "Representative Name": "Don Frantz",
              "Council Website": "http://www.townofcary.org/Town_Council/Cary_Town_Council.htm",
              "Last Update Date": "Null",
              "Last Editor": "Null",
              "At Large Representative 1": "Lori Bush",
              "At Large Representative 2": "Ed Yerha",
              "Mayor": "Harold Weinbrecht",
              "Wake Co BOA": "http://www.wakegov.com/elections/Pages/default.aspx",
              "Chatham Co BOA": "http://www.chathamnc.org/Index.aspx?page=110",
              "Board of Elections": "http://www.wakegov.com/elections/Pages/default.aspx",
              "Shape": "Polygon",
              "Shape.STArea()": "366025445.3125",
              "Shape.STLength()": "314712.777278"
            }
          }
        ]
      };
    context('one council member', function() {
      it('formats the status as expected', function() {
        expect(subject.formatMyCouncilMember(status)).to.eq('You belong to District B, and your Council Member is Don Frantz. Your at large council members are Lori Bush, and Ed Yerha. The mayor is Harold Weinbrecht.');
      });
    });
  });
  describe('#formatParkInfo', function() {
    var status = {
      "features": [
        {
          "attributes": {
            "OBJECTID": 39,
            "FACILITYID": "39",
            "NAME": "Heater Park",
            "SUBTYPEFIELD": 790,
            "FEATURECODE": null,
            "FULLADDR": "400 S. West Street Cary NC 27511",
            "OPERDAYS": "Sun-Sat",
            "OPERHOURS": "Sunrise to Sunset",
            "PARKAREA": 1.49,
            "PARKURL": "http://www.townofcary.org/recreation-enjoyment/parks-greenways-environment/parks/heater-park",
            "NUMPARKING": -9999,
            "RESTROOM": "No",
            "ADACOMPLY": "No",
            "CAMPING": null,
            "SWIMMING": null,
            "HIKING": null,
            "FISHING": null,
            "PICNIC": "No",
            "BOATING": null,
            "HUNTING": null,
            "ROADCYCLE": null,
            "MTBCYCLE": null,
            "PLAYGROUND": "No",
            "GOLF": null,
            "SKI": null,
            "SOCCER": "No",
            "BASEBALL": "No",
            "BASKETBALL": "No",
            "SKATEPARK": "No",
            "TENNISCOURT": "No",
            "VOLLEYBALL": "No",
            "FITNESSTRAIL": "No",
            "NATURETRAIL": "No",
            "TRAILHEAD": "No",
            "OPENSPACE": "No",
            "LAKE": "No",
            "AMPITHEATER": "No",
            "DOGPARK": "No",
            "DISCGOLF": "No",
            "CLIMBINGROCKS": "No",
            "CLIMBINGROPES": "No",
            "BATTINGCAGES": "No"
          },
          "geometry": {
            "x": -78.78598197756895,
            "y": 35.78260079150859
          }
        },
        {
          "attributes": {
            "OBJECTID": 41,
            "FACILITYID": "41",
            "NAME": "Lexie Lane Park",
            "SUBTYPEFIELD": 790,
            "FEATURECODE": null,
            "FULLADDR": "301 N. Dixon Avenue Cary NC 27513",
            "OPERDAYS": "Sun-Sat",
            "OPERHOURS": "Sunrise to Sunset",
            "PARKAREA": 2.82,
            "PARKURL": "http://www.townofcary.org/recreation-enjoyment/parks-greenways-environment/parks/lexie-lane-park",
            "NUMPARKING": -9999,
            "RESTROOM": "Yes",
            "ADACOMPLY": "No",
            "CAMPING": null,
            "SWIMMING": null,
            "HIKING": null,
            "FISHING": null,
            "PICNIC": "No",
            "BOATING": null,
            "HUNTING": null,
            "ROADCYCLE": null,
            "MTBCYCLE": null,
            "PLAYGROUND": "Yes",
            "GOLF": null,
            "SKI": null,
            "SOCCER": "No",
            "BASEBALL": "Yes",
            "BASKETBALL": "Yes",
            "SKATEPARK": "No",
            "TENNISCOURT": "No",
            "VOLLEYBALL": "No",
            "FITNESSTRAIL": "No",
            "NATURETRAIL": "No",
            "TRAILHEAD": "No",
            "OPENSPACE": "No",
            "LAKE": "No",
            "AMPITHEATER": "No",
            "DOGPARK": "No",
            "DISCGOLF": "No",
            "CLIMBINGROCKS": "No",
            "CLIMBINGROPES": "No",
            "BATTINGCAGES": "No"
          },
          "geometry": {
            "x": -78.78938964654577,
            "y": 35.78906936020467
          }
        }
      ]
    }
    context('two parks', function() {
      it('formats the status as expected', function() {
        expect(subject.formatNearbyParks(status)).to.eq('There are 2 parks nearby including Heater Park located at 400 S. West Street, Lexie Lane Park located at 301 N. Dixon Avenue, ');
      });
    });
  });
  /* keeping this commented out until public art data set is back up
  describe('#formatPublicArtInfo', function() {
    var status = {
      "features": [
        {
          "attributes": {
            "Name": "Join the Parade",
            "Artist": "Jane A. Rankin",
            "Location_Desc": "Town Hall Campus, North Academy Street",
            "Address": "316 N Academy St, Cary, NC 27513 ",
            "Caption": "This artwork by Jane A. Rankin commemorates the importance of Cary's Band in the history of the town. The first child with cymbals honors former Mayor Koka Booth, a long-time supporter of band activities.",
            "Lat": 35.7911415,
            "Long": -78.7790146,
            "Icon_color": "r",
            "URL": "http://img.groundspeak.com/waymarking/large/13a2d8c8-fdfe-4feb-ae2f-5aa4477debf5.jpg#isImage",
            "Thumb_URL": "http://img.groundspeak.com/waymarking/large/13a2d8c8-fdfe-4feb-ae2f-5aa4477debf5.jpg",
            "FID": 1
          },
          "geometry": {
            "x": -78.78104378037548,
            "y": 35.78960249307244
          }
        },
        {
          "attributes": {
            "Name": "Messenger",
            "Artist": "Gary Price",
            "Location_Desc": "Cary Library, Downtown Cary",
            "Address": "310 S Academy St, Cary, NC 27511",
            "Caption": "This artwork by Gary Price commemorates a local scholarship program. It stands outside the downtown library on S. Academy Street.",
            "Lat": 35.7842636,
            "Long": -78.7819519,
            "Icon_color": "R",
            "URL": "http://services2.arcgis.com/l4TwMwwoiuEVRPw9/arcgis/rest/services/Art_in_Public_Places/FeatureServer/0/9/attachments/77",
            "Thumb_URL": "http://services2.arcgis.com/l4TwMwwoiuEVRPw9/arcgis/rest/services/Art_in_Public_Places/FeatureServer/0/9/attachments/78",
            "FID": 9
          },
          "geometry": {
            "x": -78.78194598482561,
            "y": 35.784248184587874
          }
        },
        {
          "attributes": {
            "Name": "3 Whirligigs",
            "Artist": null,
            "Location_Desc": null,
            "Address": null,
            "Caption": "Artist: Vollis Simpson Location: Corner of Academy Street and Chapel Hill Road",
            "Lat": null,
            "Long": null,
            "Icon_color": "r",
            "URL": "http://services2.arcgis.com/l4TwMwwoiuEVRPw9/arcgis/rest/services/Art_in_Public_Places/FeatureServer/0/13/attachments/83",
            "Thumb_URL": "http://services2.arcgis.com/l4TwMwwoiuEVRPw9/arcgis/rest/services/Art_in_Public_Places/FeatureServer/0/13/attachments/84",
            "FID": 13
          },
          "geometry": {
            "x": -78.78078238963992,
            "y": 35.791090902573465
          }
        }
      ]
    }
    context('two art', function() {
      it('formats the status as expected', function() {
        expect(subject.formatNearbyPublicArt(status)).to.eq('There are 2 pieces of public art nearby including Join the Parade located at 316 N Academy St, Cary, NC 27513 , Messenger located at 310 S Academy St, Cary, NC 27511, ');
      });
    });
  });
  */
});
