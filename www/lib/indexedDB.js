define({
  load: function (id, require, load, config) {
    // Just ignore for builds.
    if (config.isBuild) {
      load();
      return;
    }

    var indexedDb = window.indexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!indexedDb) {
      require(['IndexedDBShim'], function () {
        load(window.indexedDB);
      }, load.error);
    } else {
      load(indexedDb);
    }
  }
});
