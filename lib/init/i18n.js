var i18n = require('../i18n')
  , path = require('path')
  , fs = require('fs')
  , utils = require('utilities')
  , file = utils.file;

module.exports = new (function () {
  var LOCALE_PAT = /([^\/]*).json$/;

  var _loadLocaleData = function (directory, callback) {
      };

  this.init = function (app, callback) {
    var localePaths = [
          __dirname + '/../../templates/locales'
        ]
      , loadLocaleData = function () {
          localePaths.forEach(function (directory) {
            directory = path.normalize(directory);
            if (file.existsSync(directory)) {
              var f
                , files = file.readdirR(directory);
              for (var i = 0; i < files.length; i++) {
                f = files[i];
                if (f && /.json$/.test(f)) {
                  // Extract the locale-name from the filename (e.g.,
                  // foo/bar/baz/en-us.json => 'en-us'
                  if ((locale = LOCALE_PAT.exec(f)) && locale[1]) {
                    try {
                      data = fs.readFileSync(f).toString();
                      data = JSON.parse(data);
                    }
                    catch(e) {
                      throw new Error('Could not parse locale-data in file: ' +
                        f);
                    }
                    i18n.loadLocale(locale[1], data);
                  }
                }
              }
            }
          });
          callback();
        };

    localePaths = localePaths.concat(geddy.config.i18n.loadPaths || []);
    loadLocaleData();
  };

})();

