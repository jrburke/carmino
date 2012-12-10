define(function (require) {
  var feeds = require('./model/feeds'),
      tmpl = require('tmpl!./listing.html');

  function listing(deck) {
console.log('listing Called');
    feeds.fetch().then(function (feed) {
console.log('FEED: ', feed);

      //Add some URI-encoded value for the urls
      if (feed.entries) {
        feed.entries.forEach(function (entry) {
          entry.linkEncoded = encodeURIComponent(entry.link);
        });
      }

      var card = deck.card('Feeds', tmpl(feed), {
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
