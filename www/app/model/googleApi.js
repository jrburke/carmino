define(function (require) {
  var googleApi,
      prim = require('prim'),
      offline = false,
      apiSent = false,
      apiResult = prim(),
      apiPromise = apiResult.promise;

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

  function convertEntries(feed, entries) {
    return (entries || []).map(function (entry) {
      return {
        link: entry.link,
        title: entry.title,
        author: entry.author || feed.author || feed.title,
        preview : entry.contentSnippet,
        content: entry.content,
        publishedDate: entry.publishedDate,
        publishedTime: new Date(entry.publishedDate).getTime(),
        feedUrl : feed.feedUrl
      };
    });
  }

  googleApi = {
    fetch: function (url) {
      return when().then(function (api) {
        var d = prim(),
            f = new api.Feed(url);

        f.load(function (result) {
          if (result.error) {
            d.reject(result.error);
            return;
          }

          result.feed.entries = convertEntries(result.feed, result.feed.entries);

          d.resolve(result.feed);
        });

        return d.promise;
      });
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
