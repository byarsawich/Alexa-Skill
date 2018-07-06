'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var jsforce = require('jsforce');
chai.use(chaiAsPromised);
var expect = chai.expect;
var SalesforceHelper = require('../salesforce_helper');
require('../salesforce_helper.js');
chai.config.includeStack = true;

/*
describe('SalesforceHelper', function() {
  var subject = new SalesforceHelper();
  var accessToken = '00D0j0000000PpF!ARIAQGX0_A5hL2.cu1086jTFYwE34Y.GgT4ntP70mmgTB88qH6eJY7QZZC9jSUZgwq2AXpXm14HxiwPX3OcGXE0yJCnjfKTz'
  var address = { x: -78.78019524656116, y: 35.7892128286608 };
  describe('#getUserAddress', function() {
    context('with a user access token', function() {
      it('returns users street address', function() {
        console.log(accessToken);
        var value = subject.getUserAddress(accessToken).then(function(results){
          return results.x;
        }).catch(function(err){
          console.log('Error in connecting to salesforce testing address');
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
          return results.start;
        }).catch(function(err){
          console.log('Error in connecting to salesforce testing hours');
          console.log(err);
        });
        return expect(value).to.eventually.eq("8 am");
      });
    });
    context('with a holiday', function() {
      var date = '2017-04-14';
      it('returns that the townhall is closed for the holiday', function() {
        var value = subject.getTownHallHours(accessToken, date).then(function(results) {
          return results.closed;
        }).catch(function(err){
          console.log('Error in connecting to salesforce testing hours with holiday');
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
          return results.closed;
        }).catch(function(err){
          console.log('Error in connecting to salesforce testing hours with weekend');
          console.log(err);
        });
        return expect(value).to.eventually.eq(true);
      });
    });
  });


});*/
/*
}, 6000);

function getAccessToken(){
  var apiEndpoint =  process.env.SALESFORCEURL; //'https://test.salesforce.com';
  var accessToken = '';
  var conn = new jsforce.Connection({
    loginUrl : apiEndpoint,
  });
  var password =  process.env.SALESFORCE_PASSWORD_311TEST + process.env.SALESFORCE_SECUIRTY_TOKEN_311TEST;
  conn.login(process.env.SALESFORCE_LOGIN_311TEST, password, function(err, userInfo) {
    if (err) {
      return console.error(err);
    }
    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.\
    accessToken = conn.accessToken;
    console.log(accessToken);
  });
  return accessToken
}
*/
