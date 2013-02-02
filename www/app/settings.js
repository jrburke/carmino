/*global console, appReset */

define(function (require) {
  var searchValue, searchTimeoutId,
    tmpl = require('tmpl!./settings.html'),
    resultsTmpl = require('tmpl!./settings-results.html'),
    googleApi = require('./model/googleApi');

  function clearSearchTimeout() {
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
      searchTimeoutId = 0;
    }
  }

  function settings(deck, data) {
    var d, card;

    card = deck.card('Settings', tmpl({}), {
        cardClass: 'skin-organic',
        toolbar: {
          '#!fn:appReset': 'App Reset',
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
  settings.appReset = function (node, evt) {
    appReset();
  };

  settings.addFeed = function (node, evt) {
    var url = evt.target.getAttribute('data-url');
    console.log('adding ')
  };

  settings.searchKeyPress = function (node, evt) {
    searchValue = evt.target.value;

    if (!searchTimeoutId) {
      searchTimeoutId = setTimeout(function () {
        searchTimeoutId = 0;
        var resultNode = node.querySelector('.search-results');
        googleApi.find(searchValue).then(function (result) {
          resultNode.innerHTML = resultsTmpl(result);
        }, function (err) {
          //An error with the API call, just clear the results.
          console.log('ERROR: ', err);
          resultNode.innerHTML = 'error';
        });
      }, 1000);
    }
  };

  return settings;
});
