define(function (require) {
  var feeds = require('./model/feeds'),
      tmpl = require('tmpl!./listing.html');

  function listing(deck) {
console.log('listing Called');
    feeds.fetch().then(function (feed) {
      var card = deck.card('Feeds', tmpl(feed), {
        menu: true
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
