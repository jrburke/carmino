define(function (require, exports, module) {
  require('Deck').init(module.id);

  return function (deck) {
    var card = deck.card('Start Screen', '<p>This is the default content that shows ' +
      'up if there is no state to restore.</p>' +
      '<a role="button" href="#app/next">Go Next</a>', {
      menu: 'app/menu'
    });

    deck.after(card, {
      immediate: true
    });
  };
});
