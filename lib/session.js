var sys = require('sys');
var fleegix = require('geddy/lib/fleegix');

var session = new function () {
  var KEY_LENGTH = 32;

  this.store = null;

  this.generateSessionId = function () {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var len = KEY_LENGTH;
    var str = '';
    var mls = new Date().getTime();
    for (var i = 0; i < len; i++) {
      var rnum = (Math.random() * chars.length);
      rnum = Math.floor(rnum);
      str += chars.substring(rnum, rnum + 1);
    }
    return str;
  };

  this.createStore = function (type) {
    var key = fleegix.string.capitalize(type);
    var constructor = require('geddy/lib/session_stores/' + type)[key];
    session.store = new constructor();
  };

}();

session.Session = function (obj) {
  this.store = null;
  this.sid = '';
  // Copy all props passed in from the app
  for (var p in obj) {
    this[p] = obj[p];
  }
  var keyName = config.sessionIdKey;
  var sid = this.cookies.get(keyName);
  if (!sid) {
    sid = session.generateSessionId()
    var dt = new Date();
    dt.setTime(dt.getTime() + (config.sessionExpiry * 1000));
    this.cookies.set(keyName, sid, {expires: dt.toGMTString()});
  }
  this.sid = sid;
};

session.Session.prototype = new function () {
  this.init = function(appCallback) {
    var _this = this;
    var localCallback = function (result) {
      _this.store = result;
      appCallback();
    };
    session.store.read(this.sid, localCallback);
  };
  
  this.get = function (key) {
    sys.puts(JSON.stringify(this.store));
    return this.store[key];
  };

  this.set = function (key, val) {
    this.store[key] = val;
    sys.puts(JSON.stringify(this.store));
  };

  this.close = function (appCallback) {
    session.store.write(this.sid, this.store, appCallback);
  };

}();

for (var p in session) { this[p] = session[p]; }

