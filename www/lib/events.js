define(function () {
  var events,
      props = ['_events', 'on', 'once', 'removeListener', 'emit'];

  function EventEmitter() {
    this._events = {};

  }

  EventEmitter.prototype = {
    on: function (id, fn) {
      var l = this._events[id];
      if (!l) {
        l = this._events[id] = [];
      }
      l.push(fn);
      return this;
    },

    once: function (id, fn) {
      var self = this;
      function one() {
        self.removeListener(id, one);
        fn.apply(null, arguments);
      }
      this.on(id, one);
    },

    removeListener: function (id, fn) {
      var i,
          l = this._events[id];
      if (l) {
        i = l.indexOf(fn);
        if (i !== -1) {
          l.splice(i, 1);
        }
      }
    },

    emit: function (id) {
      var args = [].slice.call(arguments, 1),
          l = this._events[id];
      if (l) {
        l.forEach(function (fn) {
          try {
            fn.apply(null, args);
          } catch (e) {
            setTimeout(function () {
              throw e;
            }, 10);
          }
        });
      }
    }
  };

  events = new EventEmitter();
  events.EventEmitter = EventEmitter;

  events.mix = function (obj) {
    var e = new EventEmitter();
    props.forEach(function (prop) {
      if (obj.hasOwnProperty(prop)) {
        throw new Error('Object already has a property "' + prop + '"');
      }
      obj[prop] = e[prop];
    });
  };

  return events;
});