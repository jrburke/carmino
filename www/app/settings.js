define(function () {
  function settings(deck, data) {
    deck.before(deck.card('Settings',
    '  <button> Setting 1 </button>' +
    '<div class="bottom-toolbar"><button data-href="app/settings" class="settings bottom-btn"></button></div>', {
      cardClass: 'skin-organic anim-vertical anim-overlay',
      toolbar: {
        '#!back': 'Done'
      }
    }));
  }

  settings.onShow = function (node, deck) {
    console.log('settings onShow called: ', node);
  };

  return settings;
});
