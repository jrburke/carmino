define(function (require, exports, module) {
  var Deck = require('Deck'),
      entriesDb = require('./model/readerDb!entries'),
      tmpl = require('tmpl!./listing.html'),
      entries = [];

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

  function listing(deck) {
    entriesDb.all().then(function (records) {
      entries = records;

      //Add some URI-encoded value for the urls
      if (entries) {
        entries = normalizeEntries(entries);
      }

      //console.log('ENTRIES: ', entries);

      var card = deck.card('Posts', tmpl({
        entries: entries
      }), {
        menu: 'app/menu'
      });

      deck.after(card, {
        immediate: true
      });
    })
    .fail(function (err) {
      console.error(err);
    });
  }

  listing.onShow = function (node, deck) {
    console.log('listing onShow', node);
  };

  return listing;
});
