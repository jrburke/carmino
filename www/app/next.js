define(function () {
  return function appNext(deck, data) {
    deck.after(deck.card('This is app/next', '<p>some other content.</p> <a role="button" href="#app/another">Go another</a>', {
      back: true
    }));
  };
});