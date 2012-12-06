define(function (require) {
  function appAnother(deck, data) {
    deck.after(deck.card('This is another', '<p>Content for another.</p>', {
      back: true
    }));
  }

  appAnother.onShow = function (node, deck) {
    console.log('appAnother onShow called: ', node);
  };

  return appAnother;
});