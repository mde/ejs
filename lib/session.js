var sys = require('sys');

var session = new function () {
  var KEY_LENGTH = 32;

  this.generateSessionKey = function () {
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
  }
}();

session.Session = function (obj) {
  // Copy all props passed in from the app
  for (var p in obj) {
    this[p] = obj[p];
  }
  var keyName = this.app.initData.sessionIdKey;
  var sessionKey = this.cookies.get(keyName);
  if (!sessionKey) {
    var dt = new Date();
    dt.setTime(dt.getTime() + (this.app.initData.sessionExpiry * 1000));
    this.cookies.set(keyName, session.generateSessionKey(),
        {expires: dt.toGMTString()});
  }
};

for (var p in session) { this[p] = session[p]; }

