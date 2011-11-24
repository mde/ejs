/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var cookies = {};

cookies.CookieCollection = function (req) {
  this.collection = {};
  if (req.headers['cookie']) {
    this.parse(req.headers['cookie'] || {});
  }
};

cookies.CookieCollection.prototype = new function () {
  this.parse = function (header) {
    var c = header.split(';');
    var item;
    var parsed, name, value;
    for (var i = 0; i < c.length; i++) {
      item = geddy.string.trim(c[i]);
      parsed = item.split('=');
      name = parsed[0];
      value = parsed[1];
      this.collection[name] = new cookies.Cookie(name, value);
    }
  };

  this.toArray = function () {
    var send = [];
    var c;
    for (var p in this.collection) {
      c = this.collection[p];
      if (c.send) {
        send.push(c.toString());
      }
    }
    return send;
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
  this.path = opts.path || '/';
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

module.exports = cookies;

