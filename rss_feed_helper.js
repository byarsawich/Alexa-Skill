'use strict';
var _ = require('lodash');
var rp = require('request-promise');
require('./jsDate.js')();
require('datejs');
const feedparser = require('feedparser-promised');
const url = 'https://www.townofcary.org/Home/Components/RssFeeds/RssFeed/View?ctID=5&cateIDs=64';

class RSSFeedHelper{

  constructor(){}

dateFilter(value) {
  var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  return value.date >= yesterday;
}

requestRSSFeed() {
  var feedData = [];
  console.log(url);
  return feedparser.parse(url).then( (items) => {
    console.log(items);
    feedData = items.filter(dateFilter);

    if(feedData[0] == undefined) {
      feedData.push(items[0]);
    }
    return feedData;

  }).catch( (error) => {
    console.log('error: ', error);
  });
};

formatRSSFeed(feedData) {
  var response = 'The latest Town of Cary News today: ';
  if (feedData[0].title == 'Town of Cary\'s Weekend Update' && feedData[1] == undefined) {
    response = 'Please check Town of Cary dot O R G for the Weekend update';
  } else {
    feedData.forEach(function(item) {
      response += _.template("${rssTitle}. ")({
        rssTitle: item.title,
      });
    });
  }
  return response = response.replace('Town of Cary\'s Weekend Update', 'Please check Town of Cary dot O R G for the Weekend update');
};
}
module.exports = RSSFeedHelper;
