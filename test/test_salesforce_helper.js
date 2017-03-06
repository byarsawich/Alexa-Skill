'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var SalesforceHelper = require('../salesforce_helper');
chai.config.includeStack = true;

describe('SalesforceHelper', function() {
  var subject = new SalesforceHelper();
  var accessToken = '00D7A0000000P0o!AQMAQG6o5blvLkuYsa1mtiw.ZqFuQVVXHOauU5wpMYSaShZjlZIGYvzJPhoF1vpcJWQazUMxGZcaj6n7eUkv3m7bZn0hIfAT';
  var address = { x: -78.78019524656116, y: 35.7892128286608 };
  describe('#getUserAddress', function() {
    context('with a user access token', function() {
      it('returns users street address', function() {
        var value = subject.getUserAddress(accessToken).then(function(results){
          console.log(results);
          return results.x;
        }).catch(function(err){
          console.log('Error in connecting to salesforce');
          console.log(err);
        });
        return expect(value).to.eventually.eq(address.x);
      });
    });
  });
  describe('#getTownHallHours', function() {
    context('with a weekday', function() {
      var date = '2018-03-02';
      it('returns normal town hall hours', function() {
        var value = subject.getTownHallHours(accessToken,date).then(function(results){
          console.log('got results back');
          console.log(results);
          return results.start;
        }).catch(function(err){
          console.log('Error in connecting to salesforce');
          console.log(err);
        });
        return expect(value).to.eventually.eq("8 am");
      });
    });
    context('with a holiday', function() {
      var date = '2017-04-14';
      it('returns that the townhall is closed for the holiday', function() {
        var value = subject.getTownHallHours(accessToken, date).then(function(results) {
          console.log('got results back');
          console.log(results);
          return results.closed;
        }).catch(function(err){
          console.log('Error in connecting to salesforce');
          console.log(err);
        });
        return expect(value).to.eventually.eq(true);
      });
    });
  });
  describe('#getTownHallHours', function() {
    context('with a weekend', function() {
      var date = '2018-03-04';
      it('returns that the townhall is closed for the weekend', function() {
        var value = subject.getTownHallHours(accessToken, date).then(function(results) {
          console.log('got results back');
          console.log(results);
          return results.closed;
        }).catch(function(err){
          console.log('Error in connecting to salesforce');
          console.log(err);
        });
        return expect(value).to.eventually.eq(true);
      });
    });
  });
});
