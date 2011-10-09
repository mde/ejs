
/**
 * @namespace Methods to override in Node's http parser, to preserve
 * multiple same-named headers, e.g., set-cookie
 */
var headersFix = {};

/**
 * Either sets a header value for single values, or arrayizes and
 * appends when there are multiple headers of the same name
 * @para {String|Array} origVal The current header value. This may
 * be undefined if it is yet unset, or a string value when there is
 * only one header with that name, ir an Array when there are
 * multiple same-named headers
 * @para {String} newVal The new HTTP header value. If the value
 * has been previously set, the previous value will be arrayized,
 * and the new value appended
 */
headersFix._setOrAppend = function (origVal, newVal) {
  var val;
  if (origVal) {
    val = origVal;
    if (typeof val == 'string') {
      val = [val];
    }
    val.push(newVal);
    return val;
  }
  else {
    return newVal;
  }
}

/**
 * Overrides the existing method in http.IncomingMessage. Instead of
 * trying to collapse values using duplicate-resolution logic from
 * RFC2616, or simply overwriting (e.g., with set-cookie), this preserves
 * all multiple instances of a same-named header in an array.
 */
headersFix._addHeaderLine = function (field, value) {
  this.headers[field] = this._setOrAppend(this.headers[field], value);
};

module.exports = headersFix;

