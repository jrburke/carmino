define(function (require, exports, module) {
  require('Deck').init(module.id);

  return function (deck) {
    deck.after(deck.card('Start Screen', '<p>This is the default content that shows ' +
              'up if there is no state to restore.</p>' +
              '<p><a href="#app/next">Go Next</a></p>'), {
      immediate: true
    });
  };
});
