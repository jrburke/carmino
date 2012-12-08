/*global google */
(function () {
  var url = 'https://www.google.com/jsapi?callback=googleFeedsDone&autoload=%7B%22modules%22%3A%5B%7B%22name%22%3A%22feeds%22%2C%22version%22%20%3A%20%221%22%2C%22language%22%20%3A%20%22en%22%7D%5D%7D',
      onLoad;

  window.googleFeedsDone = function () {
    google.load("feeds", "1", {"callback" : function () {
      onLoad(google.feeds);
    }});
  };

  define({
    load: function (id, require, load) {
      onLoad = load;
      require([url], function () {
        // Nothing to do here, real
        // action is in global callback function.
      }, function (err) {
        load.error(err);
      });
    }
  });
}());