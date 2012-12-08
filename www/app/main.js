define(function (require, exports, module) {
  var Deck = require('Deck'),
      tmpl = require('tmpl!./main.html'),
      model = require('./model/feeds');

  Deck.init('app/listing');

  return function (deck) {
    var card = deck.card('Get started', tmpl({}), {
      menu: 'app/menu'
    });

    deck.after(card, {
      immediate: true
    });
  };
});
