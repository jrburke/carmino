
//An app reset, in case we get into a bad state and need to reset all from
//web console.
function appReset() {
    require('Deck').reset();
    require('IDB').deleteDatabase('reader');
    location.reload(true);
}

define(function (require, exports, module) {
  var Deck = require('Deck');

  Deck.init('app/listing');
});
