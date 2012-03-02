var i18n = require('../i18n')
  , exec = require('child_process').exec
  , path = require('path')
  , fs = require('fs')
  , fileUtils = require('../utils/file');

module.exports = new (function () {
  var LOCALE_PAT = /([^\/]*).json$/;

  var _loadLocaleData = function (directory, callback) {
      };

  this.init = function (callback) {
    var localePaths = [
          __dirname + '/../../templates/locales'
        ]
      , loadLocaleData = function () {
          localePaths.forEach(function (directory) {
            directory = path.normalize(directory);
            if (path.existsSync(directory)) {
              var files = fileUtils.readdirR(directory);
              for (var i = 0; i < files.length; i++) {
                file = files[i];
                if (file && /.json$/.test(file)) {
                  // Extract the locale-name from the filename (e.g.,
                  // foo/bar/baz/en-us.json => 'en-us'
                  if ((locale = LOCALE_PAT.exec(file)) && locale[1]) {
                    try {
                      data = fs.readFileSync(file).toString();
                      data = JSON.parse(data);
                    }
                    catch(e) {
                      throw new Error('Could not parse locale-data in file: ' +
                        file);
                    }
                    i18n.loadLocale(locale[1], data);
                  }
                }
              }
            }
          });
          callback();
        };

    localePaths = localePaths.concat(geddy.config.i18n.loadPaths);
    loadLocaleData();
  };

})();


