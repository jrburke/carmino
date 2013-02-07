/*global define, console */
define(function (require, exports, module) {
  var Deck = require('Deck'),
      tmpl = require('tmpl!./menu.html'),
      feedsDb = require('./model/readerDb!feeds');

  function normalizeFeeds(feeds) {
    return feeds.map(function (feed) {
      feed = Object.create(feed);
      feed.linkEncoded = 'feedUrl=' + encodeURIComponent(feed.feedUrl) +
                         '&title=' + encodeURIComponent(feed.author || feed.title);
      return feed;
    });
  }

  feedsDb.on('add', function (values) {
    if (!Array.isArray(values)) {
      values = [values];
    }

    // A bit inefficient, but add should only happen one add at a time,
    // no bulk adds right now, so it works out, and this work is async anyway.
    feedsDb.all().then(function (records) {
      var html = tmpl({
        feeds: normalizeFeeds(records)
      });

      Deck.updateCards(module.id, function (cardNode) {
        cardNode.querySelector('.content')
          .innerHTML = html;
      });
    });
  });

  function menu(deck) {

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
    console.log('menu onShow called: ', node, deck);
  };

  return menu;
});
