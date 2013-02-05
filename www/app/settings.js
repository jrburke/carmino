/*global console, appReset */

define(function (require) {
  var searchValue, lastSearchPromise, searchTimeoutId,
    tmpl = require('tmpl!./settings.html'),
    resultsTmpl = require('tmpl!./settings-results.html'),
    googleApi = require('./model/googleApi'),
    readerDb = require('./model/readerDb');

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

    return readerDb.updateFeed(url).then(function () {
      // No need to do anything here, Deck will take care of nav given
      // the okHref above.
    }, function (err) {
      deck.dialog({
        title: 'Error fetching feed',
        content: '<p>Could not fetch the feed at</p><p>' + url + '</p><p>' + err.toString(),
        ok: 'OK'
      });

      return err;
    });
  };

  settings.searchKeyPress = function (node, deck, data, evt) {
    searchValue = evt.target.value;

    if (!searchTimeoutId) {
      searchTimeoutId = setTimeout(function () {
        searchTimeoutId = 0;
        var localPromise = googleApi.find(searchValue),
            resultNode = node.querySelector('.search-results');

        // Make sure last
        lastSearchPromise = localPromise;

        lastSearchPromise.then(function (result) {
          // Do not bother with the work if not the last search promise.
          if (lastSearchPromise !== localPromise) {
            return;
          }

          resultNode.innerHTML = resultsTmpl(result);
          lastSearchPromise = null;
        }, function (err) {
          // Do not bother with the work if not the last search promise.
          if (lastSearchPromise !== localPromise) {
            return;
          }

          //An error with the API call, just clear the results.
          console.log('ERROR: ', err);
          resultNode.innerHTML = 'error';
          lastSearchPromise = null;
        });
      }, 1000);
    }
  };

  return settings;
});
