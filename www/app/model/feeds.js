define(function (require) {

/*

 https://blog.mozilla.org/feed/'
*/

  var feeds, db,
      prim = require('prim'),
      googleApi = require('./googleApi'),
      feedsPromise = require('./readerDb').feedsPromise(),
      events = require('events');

  //Init the feeds
  feedsPromise.then(function (feedsDb) {
    return feedsDb.all();
  }).then(function (records) {
//xxx
  });

  feeds = {

  };

  events.mix(feeds);

  return feeds;
});
