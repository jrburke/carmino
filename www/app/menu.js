/*global define, console */
define(function (require) {
  var tmpl = require('tmpl!./menu.html'),
      feedsDb = require('./model/readerDb!feeds');

  function normalizeFeeds(feeds) {
    return feeds.map(function (feed) {
      feed = Object.create(feed);
      feed.linkEncoded = 'feedUrl=' + encodeURIComponent(feed.feedUrl) +
                         '&title=' + encodeURIComponent(feed.author || feed.title);
      return feed;
    });
  }

  function menu(deck, data) {

    feedsDb.all().then(function (records) {
      var feeds = normalizeFeeds(records);

      console.log('Feed INFO: ', feeds);

      deck.before(deck.card('Menu', tmpl({
        feeds: feeds
      }), {
        cardClass: 'skin-organic menu',
        toolbar: true ? {
          '#!back': 'X'
        } : {}
      }));
    })
    .fail(function (err) {
      console.error(err);
    });
  }

  menu.onShow = function (node, deck) {
    console.log('menu onShow called: ', node);
  };

  return menu;
});
