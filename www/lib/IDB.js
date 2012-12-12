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
          setTimeout(function () {
            options.onupgradeneeded(db);
            d.resolve(db);
          }, 10);
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

    // Eventually returns the object store from a transaction in the given
    // mode: 'readonly', 'readwrite' or 'versionchange'
    tx: function (mode, storeName) {
      storeName = storeName || this.storeName;
      return this.dbp.then(function (db) {
        return db.transaction(storeName, mode);
      });
    },

    put: function (value, key, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName).put(value, key));
      });
    },

    add: function (value, key, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName).add(value, key));
      });
    },

    del: function (key, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName)['delete'](key));
      });
    },

    get: function (key, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_ONLY, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName).get(key));
      });
    },

    clear: function (storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName).clear());
      });
    },

    count: function (key, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        var os = tx.objectStore(storeName);
        return prom(os.count(key));
      });
    },

    openCursor: function (range, direction, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_ONLY, storeName).then(function (tx) {
        return prom(tx.objectStore(storeName).openCursor(range, direction));
      });
    },

    // index stuff
    createIndex: function (name, keyPath, optionalParameters, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return tx.objectStore(storeName).createIndex(name, keyPath, optionalParameters);
      });
    },

    index: function (name, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_ONLY, storeName).then(function (tx) {
        return tx.objectStore(storeName).index(name);
      });
    },

    deleteIndex: function (name, storeName) {
      storeName = storeName || this.storeName;
      return this.tx(TX.READ_WRITE, storeName).then(function (tx) {
        return tx.objectStore(storeName).deleteIndex(name);
      });
    }
  };

  return IDB;
});










