define(function (require) {
  var googleApi,
      prim = require('prim'),
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

  googleApi = {
    fetch: function (url) {
      if (feedsResult.finished()) {
        return feedsPromise;
      } else {
        return when().then(function (api) {
          var f = new api.Feed(url);

          f.load(function (result) {
            if (result.error) {
              feedsResult.reject(result.error);
              return;
            }

            feedsResult.resolve(result.feed);
          });

          return feedsPromise;
        });
      }
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

  return googleApi;
});
