define(function (require) {
  var entries = require('./model/entries'),
      tmpl = require('tmpl!./listing.html');

  function listing(deck) {
    entries.then(function (entriesIDB) {
      return entriesIDB.all();
    }).then(function (entries) {

      //Add some URI-encoded value for the urls
      if (entries) {
        entries = entries.map(function (entry) {
          entry = Object.create(entry);
          entry.linkEncoded = 'author=' + encodeURIComponent(entry.feedUrl) +
                              '&id=' + encodeURIComponent(entry.link);
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
