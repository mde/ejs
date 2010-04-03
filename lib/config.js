var sys = require('sys');

var fleegix = require('geddy/lib/fleegix');

var Config = function (dirname) {
  
  this.environment = 'development';
  this.port = 8000;
  this.dirname = dirname;
  this.staticFilePath = dirname + '/public';
  
  this.sessions = {
    store: 'couchdb',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60,
    dbHostname: 'localhost',
    dbName: 'geddy_sessions',
    dbPort: 5984
  };

  // Override with app-level opts
  var opts = require(dirname + '/config/config');
  fleegix.mixin(this, opts, true);
};

exports.Config = Config;
