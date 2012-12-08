define(function (require) {
  var prim = require('prim'),
      offline = false,
      apiSent = false,
      feedsResult = prim(),
      feedApi = feedsResult.promise;

  function when() {
    if (!apiSent) {
      apiSent = true;
      // Load google API. It is OK if this fails, could be offline.
      require(['googleFeeds!'], function (value) {
        feedsResult.resolve(value);
      }, function (err) {
        // This OK, just ignore the error.
        offline = true;
        feedsResult.reject(err);
      });
    }
    return feedApi;
  }

  return {
    fetch: function () {
      return when().then(function (feeds) {
        var d = prim(),
            f = new feeds.Feed('https://blog.mozilla.org/feed/');

        f.load(function (result) {
          if (result.error) {
            d.reject(result.error);
            return;
          }

          d.resolve(result.feed);
        });

        return d.promise;
      });
    },

    getUrls: function () {
      return prim().resolve([]).promise;
    },

    find: function (query) {
      var d = prim();

      when().then(function (feeds) {
        feeds.findFeeds(query, function (results) {
          d.resolve(results);
        });
      });

      return d.promise;
    }
  };
});