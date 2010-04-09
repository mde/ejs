var sys = require('sys');

var Cookie = function () {
  this.authenticate =  function(controller, callback) {
    // The key to look for in the session to indicate logged-in status
    var key = config.plugins.Auth.authedSessionKey || 'login';
    // Check for the existence of a login ID in the session
    var authed = !!controller.session.get(key);
    callback(authed);
  };
};

exports.Cookie = Cookie;
