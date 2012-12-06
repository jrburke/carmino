define(function () {
  function appNext(deck, data) {
    deck.after(deck.card('This is app/next', '<p>some other content.</p> <a role="button" href="#app/another">Go another</a>', {
      back: true
    }));
  }

  appNext.onShow = function (node, deck) {
    console.log('appNext onShow called: ', node);
  };

  return appNext;
});
