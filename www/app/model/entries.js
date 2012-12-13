define(function (require) {
  var entriesPromise = require('./readerDb').entriesPromise(),
    // Ask for feeds so that defaults are initialized.
    feedsPromise = require('./feeds');

  return feedsPromise.then(function () {
    return entriesPromise;
  });
});
