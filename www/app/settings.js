define(function () {
  function settings(deck, data) {
    var d, card;

    card = deck.card('Settings',
      '  <button data-href="#app/next"> Setting 1 </button>' +
      '<div class="bottom-toolbar"></div>', {
        cardClass: 'skin-organic',
        toolbar: {
          '#!back': 'Done'
        }
      });

    d = deck.create({
      deckClass: 'anim-vertical anim-overlay',
      card: card
    });

    deck.before(d);
  }

  settings.onShow = function (node, deck) {
    console.log('settings onShow called: ', node);
  };

  settings.onHide = function (node, deck) {
    console.log('settings onHide called: ', node);
  };

  settings.onDestroy = function (node, deck) {
    console.log('settings onDestroy called: ', node);
  };
  return settings;
});
