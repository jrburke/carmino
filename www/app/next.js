define(function () {
  return function appNext(deck, data) {
    deck.after(deck.card('THIS IS NEXT', 'some other content. <a href="#app/another">Go another</a>.', {
      backTitle: 'Main'
    }));
  };
});