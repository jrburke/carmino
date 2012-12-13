define(function (require) {
  var readerDb, feedsDb, entriesDb, db, options,
      dbName = 'reader',
      version = 1,
      IDB = require('IDB');

  // IndexedDB setup options.
  options = {
    stores: ['feeds', 'entries'],
    onupgradeneeded: function (db) {
      db.createObjectStore('feeds', { keyPath: 'feedUrl' });

      var entryStore = db.createObjectStore('entries', { keyPath: 'link' });

      entryStore.createIndex('feedUrl', 'feedUrl', { unique: false });
      entryStore.createIndex('published', 'published', { unique: false });
    }
  };

  db = new IDB(dbName, version, options);

  readerDb = {
    feedsPromise: function () {
      return db.dbp.then(function () {
        return feedsDb || (feedsDb = new IDB(dbName, version, 'feeds'));
      });
    },

    entriesPromise: function () {
      return db.dbp.then(function () {
        return entriesDb || (entriesDb = new IDB(dbName, version, 'entries'));
      });
    },

    deleteDb: function () {
      return IDB.deleteDatabase(dbName);
    }
  };
});