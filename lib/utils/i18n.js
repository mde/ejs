

var i18n = new (function () {
  var _currentLocale = ''
    , _strings = {};

  this.getText = function (key, opts, locale) {
    var str = _strings[locale || geddy.config.defaultLocale][key] ||
          "[[" + key + "]]";
    for (p in opts){
      str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), opts[p]);
    }
    return str;
  };

  this.loadLocale = function (locale, strings) {
    _strings[locale] = strings;
  };

})();

i18n.I18n = function (controller) {
  this.t = function (key, opts) {
    i18n.getText(key, opts || {}, controller.locale);
  };
};

exports.i18n = i18n;
