var sys = require('sys');

var Cookie = function () {
  this.authenticate =  function(controller, callback) {
    sys.puts('cookie auth');
    callback(true);
  };
};

exports.Cookie = Cookie;
