define(function (require) {
  var entriesDb = require('./model/readerDb!entries'),
      tmpl = require('tmpl!./detail.html');

  function detail(deck, data) {
    entriesDb.get(data.id).then(function (data) {

      var card = deck.card(data.author, tmpl(data), {
        back: true
      });

      deck.after(card);
    })
    .fail(function (err) {
      console.error(err);
    });
  }

  detail.onShow = function (node, deck) {
    console.log('details onShow', node);
  };

  return detail;
});