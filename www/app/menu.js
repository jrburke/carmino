define(function () {
  function menu(deck, data) {
    deck.before(deck.card('Menu',
    '  <button> Action 1 </button>' +
    '  <button> Action 2 </button>' +
    '  <button> Action 3 </button>' +
    '  <button>  Cancel  </button>' +
    '<div class="bottom-toolbar"><button data-href="#app/settings" class="settings bottom-btn"></button></div>', {
      cardClass: 'skin-organic menu'
    }));
  }

  menu.onShow = function (node, deck) {
    console.log('menu onShow called: ', node);
  };

  return menu;
});
