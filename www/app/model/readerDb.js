define(function (require) {
  var readerDb, feedsDb, entriesDb, db, options,
      dbName = 'reader',
      version = 1,
      IDB = require('IDB');

  // IndexedDB setup options.
  options = {
    stores: ['feeds', 'entries'],
    onupgradeneeded: function (db) {
      db.createObjectStore('feeds', { keyPath: 'feedUrl', autoIncrement: false });

      var entryStore = db.createObjectStore('entries', { keyPath: 'link', autoIncrement: false });

      entryStore.createIndex('feedUrl', 'feedUrl', { unique: false });
      entryStore.createIndex('publishedTime', 'publishedTime', { unique: false });
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

  return readerDb;
});