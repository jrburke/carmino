define(function (require) {
  var readerDb, feedsDb, entriesDb, db, options, defaults, welcomeFeed,
      welcomeEntry, whenDbUp,
      dbName = 'reader',
      version = 1,
      prim = require('prim'),
      IDB = require('IDB'),
      googleApi = require('./googleApi');

  // IndexedDB setup options.
  options = {
    stores: ['feeds', 'entries'],
    onupgradeneeded: function (db) {
      db.createObjectStore('feeds', { keyPath: 'feedUrl', autoIncrement: false });

      var entryStore = db.createObjectStore('entries', { keyPath: 'link', autoIncrement: false });

      entryStore.createIndex('feedUrlIndex', 'feedUrl', { unique: false, multiEntry: true });
      entryStore.createIndex('publishedTimeIndex', 'publishedTime', { unique: false, multiEntry: true });
    }
  };

  db = new IDB(dbName, version, options);

  defaults = [
    'https://blog.mozilla.org/feed/'
  ];

  welcomeFeed = {
    feedUrl: 'http://jrburke.com/reader-bogus/feed/',
    author: 'James Burke',
    title: 'Sample Feed',
    description: 'A sample feed you can delete. It just has a welcome message post.'
  };

  welcomeEntry = {
    author: 'James Burke',
    content: '<div><p>Welcome to the feed reader. This is just a sample piece of content.</p><p>You can remove the "Sample Feed" by using the Menu button in the upper left corner of the "Posts" screen.</p></div>',
    preview: 'Welcome to the feed reader',
    link: 'http://jrburke.com',
    feedUrl: 'http://jrburke.com/reader-bogus/feed/',
    publishedDate: 'Sun, 11 Nov 2012 05:32:06 -0800',
    publishedTime: 1352640726000,
    title: 'Welcome!'
  };

  function seedDefaults() {
    // It is OK if some of these fail.
    // Seed some values.
    defaults.forEach(function (url) {
      var feed;
      googleApi.fetch(url).then(function (f) {
        feed = f;
        return feedsDb.add(feedsDb.toFeedValue(feed));
      }).then(function () {
        return entriesDb.addBulk(feed.entries);
      });
    });
  }

  whenDbUp = db.dbp.then(function () {
    // Set up the feedsDb
    feedsDb = new IDB(dbName, version, 'feeds');
    feedsDb.toFeedValue = function (feed) {
      var publishedTime = 0;

      // Find latest publishedTime to keep track of for new additions.
      if (feed.entries) {
        feed.entries.map(function (entry) {
          if (entry.publishedTime > publishedTime) {
            publishedTime = entry.publishedTime;
          }
        });
      }

      return {
        feedUrl: feed.feedUrl,
        author: feed.author,
        title: feed.title,
        description: feed.description,
        lastPublishedTime: publishedTime
      };
    };
  }).then(function () {
    // Set up the entriesDb
    entriesDb = new IDB(dbName, version, 'entries');
  }).then(function () {
    //Init the feeds
    return feedsDb.count();
  }).then(function (count) {
    if (count === 0) {
      return prim().start(function () {
        return feedsDb.add(welcomeFeed);
      }).then(function () {
        return entriesDb.add(welcomeEntry);
      }).then(function () {
        seedDefaults();
      });
    }
  });

  readerDb = {
    updateFeed: function (url) {
      var feed, feedRecord,
          newTime = 0,
          entries = [];

      return whenDbUp.then(function () {
        return googleApi.fetch(url);
      }).then(function (f) {
        feed = f;
        return feedsDb.get(url);
      }).then(function (record) {
        if (!record) {
          // New feed, just add it.
          return feedsDb.add(feedsDb.toFeedValue(feed)).then(function () {
            return entriesDb.addBulk(feed.entries);
          });
        } else {
          feedRecord = record;

          // Find any new feeds since feed.lastPublishedTime
          var lastTime = feed.lastPublishedTime;

          feed.entries.map(function (entry) {
            if (entry.publishedTime > lastTime) {
              entries.push(entry);
              if (entry.publishedTime > newTime) {
                newTime = entry.publishedTime;
              }
            }
          });

          if (entries.length) {
            return entriesDb.addBulk(entries);
          }
        }
      }).then(function () {
        // If have a new last published time update feed info.
        if (feedRecord && newTime) {
          feedRecord.lastPublishedTime = newTime;
          return feedsDb.put(feedRecord.feedUrl, feedRecord);
        }
      });
    },

    // AMD loader plugin method that allows using the 'readerDB![dbname]'
    // syntax as a module dependency.
    load: function (id, require, load, config) {
      if (config.isBuild) {
        load();
        return;
      }

      if (id === 'feeds') {
        whenDbUp.then(function () {
          return feedsDb;
        }).then(load, load.error);
      } else if (id === 'entries') {
        whenDbUp.then(function () {
          return entriesDb;
        }).then(load, load.error);
      } else {
        load.error(new Error('Invalid db: ' + id));
      }
    },

    deleteDb: function () {
      return IDB.deleteDatabase(dbName);
    }
  };

  return readerDb;
});