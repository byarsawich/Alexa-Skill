'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var OpenDataHelper = require('../open_data_helper');
var OPENDATAENDPOINT = 'https://data.townofcary.org/api/records/1.0/search/?';
chai.config.includeStack = true;

describe('OpenDataHelper', function() {
  var subject = new OpenDataHelper();
  describe('#getOpenGymTimes', function() {
    context('with a date', function() {
      it('returns gym times on current date', function() {
        var today = new Date('2017-03-24');
        var open_gym_date = today.toISOString().substring(0,10);
        var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=open_gym_start==' + open_gym_date + '&facet=community_center&timezone=America/New_York&exclude.community_center=CAC';
        var value = subject.requestOpenData(uri).then(function(obj) {
          return obj.records[0].fields.date_scanned;
        });
        return expect(value).to.eventually.eq(open_gym_date);
      });
    });
  });
  describe('#getOpenGymTimes', function() {
    context('with a date and location', function() {
      it('returns gym times on date only for BPCC', function() {
        var today = new Date('2017-01-10');
        var open_gym_date = today.toISOString().substring(0,10);
        var location = 'BPCC';
        var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=open_gym_start==' + open_gym_date + ' AND community_center==' + location +  '&facet=community_center&timezone=America/New_York&exclude.community_center=CAC';
        var value = subject.requestOpenData(uri).then(function(obj) {
          return obj.records.length;
        });
        return expect(value).to.eventually.eq(2);
      });
    });
  });
  describe('#formatGymTimes', function() {
    var status = {
      "nhits": 4,
      "parameters": {
        "dataset": [
          "open-gym"
        ],
        "timezone": "UTC",
        "q": "open_gym_start == '2017-01-06",
        "rows": 10,
        "format": "json",
        "facet": [
          "facility_title",
          "pass_type",
          "community_center",
          "open_gym",
          "group",
          "date_scanned"
        ]
      },
      "records": [
        {
          "datasetid": "open-gym",
          "recordid": "705ddb95b54abd49df7d7c1786013ea24d66bc99",
          "fields": {
            "postal_code1": "27513",
            "open_gym_start": "2017-01-06T20:30:00+00:00",
            "group": "Youth/Teen",
            "community_center": "BPCC",
            "open_gym_end": "2017-01-06T22:30:00+00:00",
            "date_scanned": "2017-01-06",
            "location": "Magnolia Gymnasium",
            "province_code1": "NC",
            "open_gym": "Basketball",
            "address11": "150 Metro Park",
            "total": 0,
            "facility_title": "Bond Park Community Center",
            "pass_type": "Open Gym - Youth/Teen BB"
          },
          "record_timestamp": "2016-08-15T14:54:00+00:00"
        },
        {
          "datasetid": "open-gym",
          "recordid": "efa1b60dfa7d3560042afc2eed8f3e50b9551951",
          "fields": {
            "postal_code1": "27513",
            "open_gym_start": "2017-01-06T14:00:00+00:00",
            "date_scanned": "2017-01-06",
            "open_gym_end": "2017-01-06T17:30:00+00:00",
            "community_center": "BPCC",
            "location": "Magnolia Gymnasium",
            "province_code1": "NC",
            "open_gym": "Pickleball",
            "address11": "150 Metro Park",
            "total": 0,
            "facility_title": "Bond Park Community Center",
            "pass_type": "Open Gym - Pickleball"
          },
          "record_timestamp": "2016-08-15T14:54:00+00:00"
        }
      ]
    };
    context('with multiple gym times', function() {
      it('formats the status as expected', function() {
        expect(subject.formatGymTimes(status)).to.eq('There are 2 open gym times on Fri Jan 06. At BOND PARK the times are: 03:30:00 PM to 05:30:00 PM for Basketball. 09:00:00 AM to 12:30:00 PM for Pickleball.');
      });
    });
    context('with no gym times', function() {
      it('formats the status as expected', function() {
        status.records = [];
        expect(subject.formatGymTimes(status)).to.eq('There are no open gym times for that date.');
      });
    });
  });
  describe('#requestCityInformation', function() {
    context('normal call to function', function() {
      it('returns the name of the mayor', function() {
        this.timeout(5000);
        var uri = OPENDATAENDPOINT + 'dataset=council-districts&q=county==wake&sort=name&facet=at_large_representatives'
        var value = subject.requestOpenData(uri).then(function(obj) {
          return obj.records[0].fields.mayor;
        });
        return expect(value).to.eventually.eq("Harold Weinbrecht");
      });
    });
  });
  var cityInfo = {
    "nhits": 4,
    "parameters": {
      "dataset": [
        "council-districts"
      ],
      "timezone": "UTC",
      "q": "county==wake",
      "rows": 10,
      "sort": "name",
      "format": "json",
      "facet": [
        "at_large_representatives"
      ]
    },
    "records": [
      {
        "datasetid": "council-districts",
        "recordid": "f2f82d0a480b0a3d83ec20530ed9c5fb92388871",
        "fields": {
          "name": "A",
          "repname": "Jennifer Robinson",
          "districturl": "http://www.townofcary.org/Town_Council/Cary_Town_Council.htm",
          "at_large_representatives": "Lori Bush,Ed Yerha",
          "geo_point_2d": [],
          "county": "wake",
          "shape_stlength": 553309.7411049065,
          "districtcounty": "Wake",
          "boeurl": "http://www.wakegov.com/elections/Pages/default.aspx",
          "geo_shape": {},
          "squaremiles": 17.07883638623223,
          "shape_starea": 476130632.3099365,
          "mayor": "Harold Weinbrecht"
        },
        "geometry": {},
        "record_timestamp": "2017-01-11T14:24:05+00:00"
      },
      {
        "datasetid": "council-districts",
        "recordid": "90ac3503fea437bacc5e3832d0421ac8ac55457e",
        "fields": {
          "name": "B",
          "repname": "Don Frantz",
          "districturl": "http://www.townofcary.org/Town_Council/Cary_Town_Council.htm",
          "at_large_representatives": "Lori Bush,Ed Yerha",
          "geo_point_2d": [],
          "county": "wake",
          "shape_stlength": 314712.7772780101,
          "districtcounty": "Wake",
          "boeurl": "http://www.wakegov.com/elections/Pages/default.aspx",
          "geo_shape": {},
          "squaremiles": 13.129356251165778,
          "shape_starea": 366025445.3125,
          "mayor": "Harold Weinbrecht"
        },
        "geometry": {},
        "record_timestamp": "2017-01-11T14:24:05+00:00"
      },
      {
        "datasetid": "council-districts",
        "recordid": "162e417851f4e50dfa8bb450817e63082d91d432",
        "fields": {
          "name": "C",
          "repname": "Jack Smith",
          "districturl": "http://www.townofcary.org/Town_Council/Cary_Town_Council.htm",
          "at_large_representatives": "Lori Bush,Ed Yerha",
          "geo_point_2d": [],
          "county": "wake",
          "shape_stlength": 348317.8036133578,
          "districtcounty": "Wake",
          "boeurl": "http://www.wakegov.com/elections/Pages/default.aspx",
          "geo_shape": {},
          "squaremiles": 17.563985942559466,
          "shape_starea": 489655825.7010498,
          "mayor": "Harold Weinbrecht"
        },
        "geometry": {},
        "record_timestamp": "2017-01-11T14:24:05+00:00"
      },
      {
        "datasetid": "council-districts",
        "recordid": "d30fd7e1548a21bc7cdf54706425b20fc7973c3f",
        "fields": {
          "name": "D",
          "repname": "Ken George",
          "districturl": "http://www.townofcary.org/Town_Council/Cary_Town_Council.htm",
          "at_large_representatives": "Lori Bush,Ed Yerha",
          "geo_point_2d": [],
          "county": "wake",
          "shape_stlength": 143265.29463668674,
          "districtcounty": "Wake",
          "boeurl": "http://www.wakegov.com/elections/Pages/default.aspx",
          "geo_shape": {},
          "squaremiles": 9.904823089556698,
          "shape_starea": 276130620.01989746,
          "mayor": "Harold Weinbrecht"
        },
        "geometry": {},
        "record_timestamp": "2017-01-11T14:24:05+00:00"
      }
    ],
    "facet_groups": [
      {
        "name": "at_large_representatives",
        "facets": [
          {
            "name": "Ed Yerha",
            "path": "Ed Yerha",
            "count": 4,
            "state": "displayed"
          },
          {
            "name": "Lori Bush",
            "path": "Lori Bush",
            "count": 4,
            "state": "displayed"
          }
        ]
      }
    ]
  };
  describe('#formatMayor', function() {
    context('return call from open data', function() {
      it('formats the status as expected', function() {
        expect(subject.formatMayor(cityInfo)).to.eq('The mayor of Cary is Harold Weinbrecht.');
      });
    });
  });
  describe('#formatAllCouncilMembers', function() {
    var responseText = 'The council member for district A, is Jennifer Robinson. The council member for district B, is Don Frantz. The council member for district C, is Jack Smith. ' +
        'The council member for district D, is Ken George. The at large representatives are Ed Yerha, and Lori Bush and the mayor is Harold Weinbrecht.'
    context('return call from open data', function() {
      it('formats the status as expected', function() {
        expect(subject.formatAllCouncilMembers(cityInfo)).to.eq(responseText);
      });
    });
  });
  describe('#formatAtLargeCouncilMembers', function() {
    var responseText = 'Your at large representatives are Ed Yerha, Lori Bush, and Harold Weinbrecht is the mayor.'
    context('return call from open data', function() {
      it('formats the status as expected', function() {
        expect(subject.formatAtLargeCouncilMembers(cityInfo)).to.eq(responseText);
      });
    });
  });
  describe('#getOpenStudioTimes', function() {
    context('with a date where there is a session', function() {
      it('returns studio times on date', function() {
        var today = new Date('2017-04-12');
        var open_gym_date = today.toISOString().substring(0,10);
        var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=open_gym_start==' + open_gym_date + '&facet=community_center&timezone=America/New_York&refine.community_center=CAC';
        return subject.requestOpenData(uri).then(function(obj) {
          return expect(obj.records.length).to.eq(1) && expect(obj.records[0].fields.facility_title).to.eq('Cary Arts Center');
        });
      });
    });
  });
  describe('#getNextStudioTime', function() {
    context('with a date where there is a session', function() {
      it('returns studio times on date', function() {
        var today = new Date('2017-04-12');
        var open_gym_date = today.toISOString().substring(0,10);
        var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=open_gym_start>=' + open_gym_date + '&facet=community_center&rows=1&sort=-date_scanned&timezone=America/New_York&refine.community_center=CAC';
        return subject.requestOpenData(uri).then(function(obj) {
          return expect(obj.records[0].fields.date_scanned).to.eq('2017-04-12') && expect(obj.records.length).to.eq(1);
        });
      });
    });
    context('with a date where there is no session', function() {
      it('returns the next date when there is a session', function() {
        var today = new Date('2017-04-14');
        var open_gym_date = today.toISOString().substring(0,10);
        var uri = OPENDATAENDPOINT + 'dataset=open-gym&q=open_gym_start>=' + open_gym_date + '&facet=community_center&rows=1&sort=-date_scanned&timezone=America/New_York&refine.community_center=CAC';
        return subject.requestOpenData(uri).then(function(obj) {
          return expect(obj.records.length).to.eq(1) && expect(obj.records[0].fields.date_scanned).to.eq('2017-04-17');
        });
      });
    });
  });
  describe('#formatStudioTimes', function() {
    var response = {
      "records":[
        {
          "datasetid":"open-gym",
          "recordid":"8dbb614642a46eaecb3967f2b38e726567ef4922",
          "fields":{
            "postal_code1":"27511",
            "open_gym_start":"2017-04-12T13:00:00-04:00",
            "date_scanned":"2017-04-12",
            "open_gym_end":"2017-04-12T15:00:00-04:00",
            "community_center":"CAC",
            "location":"Principals Hall",
            "province_code1":"NC",
            "open_gym":"Open Studio",
            "address11":"101 Dry AVE",
            "total":0,
            "facility_title":"Cary Arts Center",
            "pass_type":"Open Studio Programs"
          },
          "record_timestamp":"2017-03-08T08:47:00-05:00"
        }
      ]
    };
    context('return call from open data', function() {
      var responseText = 'There is 1 open studio time on Wed Apr 12 from 01:00:00 PM to 03:00:00 PM.'
      it('formats the status as expected', function() {
        expect(subject.formatStudioTimes(response)).to.eq(responseText);
      });
    });
  });
  describe('#formatNextStudioTime', function() {
    var response = {
      "records":[
        {
          "datasetid":"open-gym",
          "recordid":"e0ff02a898d29a6059262fda02d88a027f21fe5e",
          "fields":{
            "postal_code1":"27511",
            "open_gym_start":"2017-04-18T17:00:00-04:00",
            "date_scanned":"2017-04-18",
            "open_gym_end":"2017-04-18T21:00:00-04:00",
            "community_center":"CAC",
            "location":"Studio M50",
            "province_code1":"NC",
            "open_gym":"Open Studio",
            "address11":"101 Dry AVE",
            "total":0,
            "facility_title":"Cary Arts Center",
            "pass_type":"Open Studio Programs"
          },
          "record_timestamp":"2017-03-08T08:47:00-05:00"
        }
      ]
    };
    context('return call from open data', function() {
      var responseText = 'The next open studio time is on Tue Apr 18 at CARY ARTS CENTER from 05:00:00 PM to 09:00:00 PM.'
      it('formats the status as expected', function() {
        expect(subject.formatNextStudioTime(response)).to.eq(responseText);
      });
    });
  });
});
