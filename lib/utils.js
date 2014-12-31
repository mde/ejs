
var _CHARS = {
    '&': '&amp;'
  , '<': '&lt;'
  , '>': '&gt;'
  , '"': '&quot;'
  , '\'': '&#39;'
};

exports.escapeRegExpChars = (function () {
  var specials = [ '^', '$', '/', '.', '*', '+', '?', '|', '(', ')',
      '[', ']', '{', '}', '\\' ];
  var sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  return function (string) {
    var str = string || '';
    str = String(str);
    return str.replace(sRE, '\\$1');
  };
})();

exports.escapeXML = function (markup) {
  var str = String(markup);
  Object.keys(_CHARS).forEach(function (k) {
    str = str.replace(new RegExp(k, 'g'), _CHARS[k]);
  });
  return str;
};

exports.shallowCopy = function (to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

