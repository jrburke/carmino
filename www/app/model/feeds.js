define(function (require) {
  var prim = require('prim'),
      offline = false,
      apiSent = false,
      apiResult = prim(),
      feedsResult = prim(),
      apiPromise = apiResult.promise,
      feedsPromise = feedsResult.promise;

  function when() {
    if (!apiSent) {
      apiSent = true;
      // Load google API. It is OK if this fails, could be offline.
      require(['googleFeeds!'], function (value) {
        apiResult.resolve(value);
      }, function (err) {
        // This OK, just ignore the error.
        offline = true;
        apiResult.reject(err);
      });
    }
    return apiPromise;
  }

  return {
    detail: function (author, id) {
      return feedsPromise.then(function (feed) {
        // Faking author right now.
        var entry;

        if (feed.entries) {
          feed.entries.some(function (e) {
            if (e.link === id) {
              entry = e;
              return true;
            }
          });
        }

        return {
          feed: feed,
          entry: entry
        };
      });
    },

    fetch: function () {
      return when().then(function (api) {
        var f = new api.Feed('https://blog.mozilla.org/feed/');

        f.load(function (result) {
          if (result.error) {
            feedsResult.reject(result.error);
            return;
          }

          feedsResult.resolve(result.feed);
        });

        return feedsPromise;
      });
    },

    getUrls: function () {
      return prim().resolve([]).promise;
    },

    find: function (query) {
      var d = prim();

      when().then(function (api) {
        api.findFeeds(query, function (results) {
          d.resolve(results);
        });
      });

      return d.promise;
    }
  };
});