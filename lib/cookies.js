var sys = require('sys');
var fleegix = require('geddy/lib/fleegix');

var cookies = new function () {}();

cookies.CookieCollection = function (req) {
  this.collection = {};
  if (req.headers.cookie) {
    this.parse(req.headers.cookie || {});
  }
};

cookies.CookieCollection.prototype = new function () {
  this.parse = function (header) {
    var c = header.split(';');
    var item;
    var parsed, name, value;
    for (var i = 0; i < c.length; i++) {
      item = fleegix.string.trim(c[i]);
      parsed = item.split('=');
      name = parsed[0];
      value = parsed[1];
      this.collection[name] = new cookies.Cookie(name, value);
    }
  };

  this.serialize = function (headers) {
    var send = [];
    var c;
    for (var p in this.collection) {
      c = this.collection[p];
      if (c.send) {
        send.push(c.toString());
      }
    }
    return send.join("\r\nSet-Cookie: ");
  };

  this.get = function (name) {
    var c = this.collection[name] || {};
    return c.value;
  };

  this.set = function (name, value, opts) {
    var c = new cookies.Cookie(name, value, opts);
    c.send = true;
    this.collection[name] = c;
  };

}();

cookies.Cookie = function (name, value, o) {
  var opts = o || {};
  this.name = name;
  this.value = value;
  this.path = opts.path || null;
  this.expires = opts.expires || null;
  this.domain = opts.domain || null;
  this.httpOnly = opts.httpOnly || false;
  this.send = false;
};

cookies.Cookie.prototype.toString = function () {
  var res = [this.name + '=' + this.value];
  var keys = ['path', 'expires', 'domain'];
  var key;
  var str;
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    if (this[key]) {
      res.push(key + '=' + this[key]);
    }
  }
  if (this.httpOnly) {
    res.push('HttpOnly');
  }
  str = res.join('; ');
  return str;
};

for (var p in cookies) { this[p] = cookies[p]; }


