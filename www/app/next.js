define(function () {
  function next(deck, data) {
    deck.after(deck.card('This is app/next', '<p>some other content.</p> <a role="button" href="#app/another">Go another</a>', {
      back: true
    }));
  }

  next.onShow = function (node, deck) {
    console.log('next onShow called: ', node);
  };

  return next;
});
