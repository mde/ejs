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
    session.store = new session[key + 'SessionStore']();
  };

}();

session.MemorySessionStore = function () {
  var _sessions = {};
  this.get = function (sid, key, val) {
    if (!_sessions[sid]) {
      _sessions[sid] = {};
    }
    return _sessions[sid][key];
  };

  this.set = function (sid, key, val) {
    if (!_sessions[sid]) {
      _sessions[sid] = {};
    }
    _sessions[sid][key] = val;
  };

};

session.Session = function (obj) {
  this.sid = '';
  // Copy all props passed in from the app
  for (var p in obj) {
    this[p] = obj[p];
  }
  var keyName = this.app.initData.sessionIdKey;
  var sid = this.cookies.get(keyName);
  if (!sid) {
    sid = session.generateSessionId()
    var dt = new Date();
    dt.setTime(dt.getTime() + (this.app.initData.sessionExpiry * 1000));
    this.cookies.set(keyName, sid, {expires: dt.toGMTString()});
  }
  this.sid = sid;
};

session.Session.prototype = new function () {
  this.get = function (key) {
    return session.store.get(this.id, key);
  };

  this.set = function (key, val) {
    return session.store.set(this.id, key, val);
  };
}();

for (var p in session) { this[p] = session[p]; }

