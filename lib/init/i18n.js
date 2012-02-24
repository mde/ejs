var i18n = require('../i18n')
  , exec = require('child_process').exec
  , path = require('path')
  , fs = require('fs');

module.exports = new (function () {
  var LOCALE_PAT = /([^\/]*).json$/;

  var _loadLocaleData = function (directory, callback) {
        exec('find ' + directory + ' | grep json$',
            function (err, stdout, stderr) {
          var files
            , file
            , locale
            , data;
          if (err) {
            throw err;
          }
          else if (stderr) {
            geddy.log.error('Error: ' + stderr);
          }
          else {
            files = stdout.split('\n');
            for (var i = 0; i < files.length; i++) {
              file = files[i];
              if (file) {
                if ((locale = LOCALE_PAT.exec(file)) && locale[1]) {
                  try {
                    data = fs.readFileSync(file).toString();
                    data = JSON.parse(data);
                  }
                  catch(e) {
                    throw new Error('Could not parse locale-data in file: ' +
                      file);
                  }
                  i18n.loadLocale(locale, data);
                }
              }
            }
            callback();
          }
        });
      }
    , _extractLocaleName = function (file) {
        match = /\/[^\/].json$/;
      };

  this.init = function (callback) {
    _loadLocaleData(__dirname + '/../../templates/locales', function () {
      var appLocaleDir = process.cwd() + '/locales';
      if (path.existsSync(appLocaleDir)) {
        _loadLocaleData(appLocaleDir, callback);
      }
      else {
        callback();
      }
    });
  };

})();


