

var i18n = new (function () {
  var _currentLocale = ''
    , _strings = {};

  this.getText = function (key, opts, locale) {
    var currentLocale = locale || geddy.config.i18n.defaultLocale
      , str = _strings[currentLocale][key] || "[[" + key + "]]";
    for (p in opts){
      str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), opts[p]);
    }
    return str;
  };

  this.loadLocale = function (locale, strings) {
    geddy.log.debug('registering ' + locale);
    _strings[locale] = _strings[locale] || {};
    geddy.mixin(_strings[locale], strings);
    geddy.log.debug('registered ' + locale + ' ' + JSON.stringify(_strings[locale]));
  };

})();

i18n.I18n = function (controller) {
  this.t = function (key, opts) {
    return i18n.getText(key, opts || {}, controller.locale);
  };
};

module.exports = i18n;
