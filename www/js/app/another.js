define(function (require) {
  return function appAnother(deck, data) {
    deck.after(deck.card('THIS IS ANOTHER', 'Content for another.', {
      backTitle: 'Back To Next'
    }));
  };
});