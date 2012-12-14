define(function (require) {
  var entriesDb = require('./model/readerDb!entries'),
      tmpl = require('tmpl!./listing.html');

  function listing(deck) {
    entriesDb.all().then(function (entries) {
      //Add some URI-encoded value for the urls
      if (entries) {
        entries = entries.map(function (entry) {
          entry = Object.create(entry);
          entry.linkEncoded = 'id=' + encodeURIComponent(entry.link);
          return entry;
        });
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
