define(['prim'], function (prim) {
  var idb,
      api = window.indexedDB || window.mozIndexedDB || window.msIndexedDB,
      dbEvents = ['onabort', 'onerror', 'onversionchange'];

  function primquest(request, resolve) {
    var d = prim();

    request.onerror = function (err) {
      d.reject(err);
    };

    request.onsuccess = function () {
      (resolve || d.resolve)(request.result);
    };

    return d;
  }

  // Like primquest, but returns the promise for then chaining.
  function prom(request) {
    return primquest(request).promise;
  }

  function IDB(id, version, options) {
    options = options || {};

    function resolve(db) {
      // Set up any common event handlers
      dbEvents.forEach(function (evtName) {
        if (options[evtName]) {
          db[evtName] = options[evtName];
        }
      });
      d.resolve(db);
    }

    var request = api.open(id, version),
        d = primquest(request, resolve);

    request.onupgradeneeded = function (evt) {
      var db = evt.target.result;
      if (options.onupgradeneeded) {
        options.onupgradeneeded(db);
        resolve(db);
      } else {
        d.reject(evt);
      }
    };

    request.onblocked = function (evt) {
      if (options.onblocked) {
        options.onblocked(evt);
      }
      d.reject(evt);
    };

    this.dbp = d.promise;
    this.storeName = options.storeName || id + 'Store';
  }

  IDB.api = api;

  IDB.deleteDatabase = function (id) {
    return primquest(api.deleteDatabase(id)).promise;
  };

  IDB.prototype = {
    prom: prom,

    // Eventually returns the object store from a transaction in the given
    // mode: 'readonly', 'readwrite' or 'versionchange'
    tx: function (mode) {
      var storeName = this.storeName;
      return this.idp.then(function (db) {
        return db.transaction([storeName], mode).objectStore(storeName);
      });
    },

    put: function (value, key) {
      this.tx('readwrite').then(function (store) {
        return prom(store.put(value, key));
      });
    },

    add: function (value, key) {
      this.tx('readwrite').then(function (store) {
        return prom(store.add(value, key));
      });
    },

    del: function (key) {
      this.tx('readwrite').then(function (store) {
        return prom(store['delete'](key));
      });
    },

    get: function (key) {
      this.tx('readonly').then(function (store) {
        return prom(store.get(key));
      });
    },

    clear: function () {
      this.tx('readwrite').then(function (store) {
        return prom(store.clear());
      });
    },

    count: function (key) {
      this.tx('readonly').then(function (store) {
        return prom(store.count(key));
      });
    },

    openCursor: function (range, direction) {
      this.tx('readonly').then(function (store) {
        return prom(store.openCursor(range, direction));
      });
    },

    // index stuff
    createIndex: function (name, keyPath, optionalParameters) {
      this.tx('readwrite').then(function (store) {
        return store.createIndex(name, keyPath, optionalParameters);
      });
    },

    index: function (name) {
      this.tx('readonly').then(function (store) {
        return store.index(name);
      });
    },

    deleteIndex: function (name) {
      this.tx('readwrite').then(function (store) {
        return store.deleteIndex(name);
      });
    }
  };

  return idb;
});










