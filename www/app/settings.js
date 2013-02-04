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

  function settings(deck) {
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

  settings.onShow = function (node) {
    console.log('settings onShow called: ', node);
  };

  settings.onHide = function (node) {
    clearSearchTimeout();
    console.log('settings onHide called: ', node);
  };

  settings.onDestroy = function (node) {
    clearSearchTimeout();
    console.log('settings onDestroy called: ', node);
  };

  // Event handlers
  settings.appReset = function () {
    appReset();
  };

  settings.askFeed = function (node, deck, data, evt) {
    var url = evt.target.getAttribute('data-url');

    deck.dialog({
      title: 'Add feed?',
      content: 'url',
      ok: true,
      cancel: true,
      okHref: '#!fn-back:addFeed?url=' + encodeURIComponent(url)
    });
  };

  settings.addFeed = function (node, deck, data) {
    var url = data.url;

    console.log(url);
  };

  settings.searchKeyPress = function (node, deck, data, evt) {
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
