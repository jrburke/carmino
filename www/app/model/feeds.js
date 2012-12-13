define(function (require) {
  var feedsDb, defaults,
      prim = require('prim'),
      d = prim(),
      waitAll = require('IDB').waitAll,
      googleApi = require('./googleApi'),
      feedsPromise = require('./readerDb').feedsPromise(),
      entriesPromise = require('./readerDb').entriesPromise();

  defaults = [
    'https://blog.mozilla.org/feed/',
    'http://xkcd.com/atom.xml'
  ];

  //Init the feeds
  feedsPromise.then(function (fdb) {
    feedsDb = fdb;

    feedsDb.toFeedValue = function (feed) {
      return {
        feedUrl: feed.feedUrl,
        author: feed.author,
        title: feed.title,
        description: feed.description
      };
    };

    return feedsDb.count();
  }).then(function (count) {
    if (count === 0) {
      var ary = [];

      // Seed some values.
      defaults.forEach(function (url) {
        var feed;
        ary.push(googleApi.fetch(url).then(function (f) {
          feed = f;
          return feedsDb.add(feedsDb.toFeedValue(feed));
        }).then(function () {
          return entriesPromise;
        }).then(function (entriesIDB) {
          return entriesIDB.addBulk(feed.entries);
        }));
      });

      return waitAll(ary);
    }
  }).then(function () {
    d.resolve(feedsDb);
  }, d.reject);

  return d.promise;
});
