var sys = require('sys');

var fleegix = require('geddy/lib/fleegix');

var Config = function (dirname) {
  
  this.environment = 'development';
  this.port = 8000;
  this.dirname = dirname;
  this.staticFilePath = dirname + '/public';
  this.plugins = {};
  
  this.sessions = {
    store: 'memory'
  };
  /*
  this.database = {
    adapter: 'couchdb'
    dbHostname: 'localhost',
    dbName: 'geddy_db',
    dbPort: 5984
  };
  
  this.sessions = {
    store: 'couchdb',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60,
    dbHostname: 'localhost',
    dbName: 'geddy_sessions',
    dbPort: 5984
  };
  */

  // Override with app-level opts
  var opts = require(dirname + '/config/config');
  fleegix.mixin(this, opts, true);
};

exports.Config = Config;
