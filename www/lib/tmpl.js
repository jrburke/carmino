// An AMD loader plugin that loads mustache templates via XHR
// then compiles the template and returns the compiled template.
// Does not work in a build setting yet.
define(['mustache'], function (mustache) {

  return {
    load: function (id, require, load) {
      var url = require.toUrl(id),
          xhr = new XMLHttpRequest();

      xhr.open('GET', url, true);

      xhr.onreadystatechange = function () {
        var status, err, text, fn;
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          status = xhr.status;
          if (status > 399 && status < 600) {
            //An http 4xx or 5xx error. Signal an error.
            err = new Error(url + ' HTTP status: ' + status);
            err.xhr = xhr;
            load.error(err);
          } else {
            text = xhr.responseText;
            try {
              fn = mustache.compile(text);
            } catch (e) {
              load.error(e);
              return;
            }
            load(fn);
          }
        }
      };

      xhr.send(null);
    }
  };
});