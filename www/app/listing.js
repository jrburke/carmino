/*global console */

define(function (require, exports, module) {
  var Deck = require('Deck'),
      entriesDb = require('./model/readerDb!entries'),
      tmpl = require('tmpl!./listing.html');

  function normalizeEntries(entries) {
    return entries.map(function (entry) {
      entry = Object.create(entry);
      entry.linkEncoded = 'id=' + encodeURIComponent(entry.link);
      return entry;
    });
  }

  entriesDb.on('add', function (values) {
    if (!Array.isArray(values)) {
      values = [values];
    }

    var html = tmpl({
      entries: normalizeEntries(values)
    });

    Deck.updateCards(module.id, function (cardNode) {
      cardNode.querySelector('.content')
        .insertAdjacentHTML('afterbegin', html);
    });
  });

  function generateCard(deck, title, entries) {
    //Add some URI-encoded value for the urls
    if (entries) {
      entries = normalizeEntries(entries);
    }

    return deck.card(title, tmpl({
      entries: entries
    }), {
      menu: 'app/menu'
    });
  }

  function listing(deck, data) {
    entriesDb.all().then(function (records) {
      var card = generateCard(deck, 'Posts', records);
      deck.after(card, {
        immediate: true
      });
    }).fail(function (err) {
      console.error(err);
    });
  }

  listing.update = function (deck, existingNode, data) {
    var promise,
        title = 'Posts';

    if (data && data.feedUrl) {
      // A feed pull
      title = data.title || 'Posts';
      promise = entriesDb.index('feedUrl', 'all');
    } else {
      promise = entriesDb.all();
    }

    return promise.then(function (records) {
      return generateCard(deck, 'Posts', records);
    }).fail(function (err) {
      console.error(err);
    });
  };

  listing.onShow = function (node, deck) {
    console.log('listing onShow', node);
  };

  return listing;
});
