define(function (require) {
  function another(deck, data) {
    deck.after(deck.card('This is another', '<p>Content for another.</p>', {
      back: true
    }));
  }

  another.onShow = function (node, deck) {
    console.log('another onShow called: ', node);
  };

  return another;
});