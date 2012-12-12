define(['prim'], function (prim) {
  var api = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB,
      TX = window.IDBTransaction,
      dbEvents = ['onabort', 'onerror', 'onversionchange'];

  if (!TX) {
    TX = {
      READ_ONLY: 'readonly',
      READ_WRITE: 'readwrite',
      VERSION_CHANGE: 'versionchange'
    };
  }

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
      var missingStores = [];

      // Set up any common event handlers
      dbEvents.forEach(function (evtName) {
        if (options[evtName]) {
          db[evtName] = options[evtName];
        }
      });

      if (!upgradeCalled && options.stores) {
        // Check for expected stores and if not
        // there call upgrade needed.
        options.stores.forEach(function (storeName) {
          if (!db.objectStoreNames.contains(storeName)) {
            missingStores.push(storeName);
          }
        });

        if (!missingStores.length) {
          d.resolve(db);
        } else if (options.onupgradeneeded) {
          options.onupgradeneeded(db);
          d.resolve(db);
        } else {
          d.reject(new Error('Missing stores' + missingStores));
        }
      } else {
        d.resolve(db);
      }
    }

    var upgradeCalled,
        request = api.open(id, version),
        d = primquest(request, resolve);

    request.onupgradeneeded = function (evt) {
      var db = evt.target.result;
      upgradeCalled = true;
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

    // Eventually passes the object store from a transaction in the given
    // mode: 'readonly', 'readwrite' or 'versionchange' to the function fn
    // fn(objectStore) should return a value, probably a promise or prom()
    // wrapping of a DOM request object.
    tx: function (mode, fn, storeName) {
      storeName = storeName || this.storeName;
      return this.dbp.then(function (db) {
        return fn(db.transaction(storeName, mode).objectStore(storeName));
      });
    },

    put: function (value, key, storeName) {
      return this.tx('readwrite', function (store) {
        return prom(store.put(value, key));
      }, storeName);
    },

    add: function (value, key, storeName) {
      return this.tx('readwrite', function (store) {
        return prom(store.add(value, key));
      }, storeName);
    },

    del: function (key, storeName) {
      return this.tx('readwrite', function (store) {
        return prom(store['delete'](key));
      }, storeName);
    },

    get: function (key, storeName) {
      return this.tx('readonly', function (store) {
        return prom(store.get(key));
      }, storeName);
    },

    clear: function (storeName) {
      return this.tx('readwrite', function (store) {
        return prom(store.clear());
      }, storeName);
    },

    count: function (key, storeName) {
      return this.tx('readonly', function (store) {
        return prom(store.count(key));
      }, storeName);
    },

    openCursor: function (range, direction, storeName) {
      return this.tx('readonly', function (store) {
        return prom(store.openCursor(range, direction));
      }, storeName);
    },

    // index stuff
    createIndex: function (name, keyPath, optionalParameters, storeName) {
      return this.tx('readwrite', function (store) {
        return store.createIndex(name, keyPath, optionalParameters);
      }, storeName);
    },

    index: function (name, storeName) {
      return this.tx('readonly', function (store) {
        return store.index(name);
      }, storeName);
    },

    deleteIndex: function (name, storeName) {
      return this.tx('readwrite', function (store) {
        return store.deleteIndex(name);
      }, storeName);
    }
  };

  return IDB;
});










