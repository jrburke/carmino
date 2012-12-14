define(function (require) {
  var entriesDb = require('./model/readerDb!entries'),
      tmpl = require('tmpl!./detail.html');

  function detail(deck, data) {
    feeds.detail(data.author, data.id).then(function (feedData) {

      var card = deck.card(feedData.feed.title, tmpl(feedData.entry), {
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