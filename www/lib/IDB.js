/*global console */

define(['prim'], function (prim) {
  var allKeyProp,
      api = window.indexedDB || window.webkitIndexedDB || window.msIndexedDB,
      dbEvents = ['onabort', 'onerror', 'onversionchange'];

  allKeyProp = {
    'all': 'openCursor',
    'allKey': 'openKeyCursor'
  };

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

  function withCursor(request, cursorFn) {
    var d = prim();

    request.onsuccess = function (evt) {
      var cursor = evt.target.result;
      cursorFn(cursor, d);
    };

    request.onerror = function (evt) {
      d.reject(evt);
    };

    return d.promise;
  }

  function makeAllCursorFn() {
    var ary = [];

    return function (cursor, d) {
      if (cursor) {
        ary.push(cursor.value);
        cursor['continue']();
      } else {
        d.resolve(ary);
      }
    };
  }

  function generateDbPromise(id, version, options, anotherD) {
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
          // Get a new handle on the db, since the upgrade may
          // have rendered current db connection invalid for mods.
          generateDbPromise(id, version, options, d);
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
        // Get a new handle on the db, since the upgrade may
        // have rendered current db connection invalid for mods.
        generateDbPromise(id, version, options, d);
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

    if (anotherD) {
      d.promise.then(function (db) {
        anotherD.resolve(db);
      });
    } else {
      return d.promise;
    }
  }

  function IDB(id, version, options) {
    options = options || {};

    if (typeof options === 'string') {
      options = {
        storeName: options
      };
    }

    this.storeName = options.storeName || id + 'Store';
    this.dbp = generateDbPromise(id, version, options);
  }

  IDB.api = api;

  IDB.KeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  IDB.log = function (p) {
    p.then(function (value) {
      console.log(value);
    }, function (err) {
      console.error(err);
    });
  };

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

    all: function (range, direction, storeName) {
      return this.openCursor(range, direction, makeAllCursorFn(), storeName);
    },

    openCursor: function (range, direction, cursorFn, storeName) {
      return this.tx('readonly', function (store) {
        var req;

        // FF (maybe others?) is sensitive about sending undefined/null args
        if (range === undefined && direction === undefined) {
          req = store.openCursor();
        } else {
          req = store.openCursor(range, direction);
        }

        return withCursor(req, cursorFn);
      }, storeName);
    },

    // index stuff
    createIndex: function (name, keyPath, optionalParameters, storeName) {
      return this.tx('readwrite', function (store) {
        return store.createIndex(name, keyPath, optionalParameters);
      }, storeName);
    },

    index: function (name, prop, propArgs, cursorFn, storeName) {
      return this.tx('readonly', function (store) {
        var req,
            index = store.index(name);

        if (prop) {
          propArgs = propArgs || [];

          if (prop === 'all' || prop === 'allKey') {
            req = index[allKeyProp[prop]].apply(index, propArgs);
            return withCursor(req, makeAllCursorFn());
          } else {
            req = index[prop].apply(index, propArgs);

            if (prop === 'openCursor' || prop === 'openKeyCursor') {
              return withCursor(req, cursorFn);
            } else {
              return prom(req);
            }
          }
        } else {
          return index;
        }
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










