define(['IDB', './model/feeds'], function (IDB, feeds) {
  window.IDB = IDB;

  function convertEntries(feed, entries) {
    return (entries || []).map(function (entry) {
      return {
        link: entry.link,
        author: entry.author || feed.author || feed.title,
        preview : entry.contentSnippet,
        content: entry.content,
        publishedDate: entry.publishedDate,
        feedUrl : feed.feedUrl
      };
    });
  }

  var undef, db = new IDB('sample', 1, {
    stores: ['feeds', 'entries'],
    onupgradeneeded: function (db) {
      db.createObjectStore('feeds', { keyPath: 'feedUrl' });

      var entryStore = db.createObjectStore('entries', { keyPath: 'link' });

      // Create an index to search customers by name. We may have duplicates
      // so we can't use a unique index.
      entryStore.createIndex('feedUrl', 'feedUrl', { unique: false });

      // Create an index to search customers by email. We want to ensure that
      // no two customers have the same email, so use a unique index.
      entryStore.createIndex('publishedDate', 'publishedDate', { unique: true });
    }
  });

  db.count(undefined, 'entries').then(function (count) {
    if (count === 0) {
      //Seed the DB.
      feeds.fetch().then(function (feed) {
        console.log('FEED: ', feed);

        db.add({
          feedUrl: feed.feedUrl,
          author: feed.author,
          title: feed.title,
          description: feed.description
        }, undef, 'feeds').then(function () {
          convertEntries(feed, feed.entries).forEach(function (entry) {
            db.add(entry, undef, 'entries');
          });
        });
      }).end();
    }
  }).end();

});

/*

* feedUrl
* author
* title
* description

Each entry:

* entry.author || feed.author || feed.title
* id: feed.feedUrl + entry.link
* preview : entry.contentSnippet
* content: entry.content
* link: entry.link
* publishedDate: entry.publishedDate
* feedUrl : feed.feedUrl
 */