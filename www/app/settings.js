/*global console */

define(function (require) {
  var searchValue, searchTimeoutId;

  function clearSearchTimeout() {
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
      searchTimeoutId = 0;
    }
  }

  function settings(deck, data) {
    var d, card,
        tmpl = require('tmpl!./settings.html');

    card = deck.card('Settings', tmpl({}), {
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
    clearSearchTimeout();
    console.log('settings onHide called: ', node);
  };

  settings.onDestroy = function (node, deck) {
    clearSearchTimeout();
    console.log('settings onDestroy called: ', node);
  };

  // Event handlers
  settings.searchKeyPress = function (node, evt) {
    searchValue = evt.target.value;

    if (!searchTimeoutId) {
      searchTimeoutId = setTimeout(function () {
        searchTimeoutId = 0;
        node.querySelector('.search-results').innerHTML = searchValue;
      }, 300);
    }
  };

  return settings;
});
