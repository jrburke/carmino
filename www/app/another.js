define(function (require) {
  return function appAnother(deck, data) {
    deck.after(deck.card('This is another', '<p>Content for another.</p>', {
      back: true
    }));
  };
});