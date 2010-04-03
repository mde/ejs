
var Config = function (dirname) {
  
  this.environment = 'development';
  this.port = 8000;
  this.dirname = dirname;
  this.staticFilePath = dirname + '/public';
  this.sessionStore = 'couchdb';
  this.sessionIdKey = 'sid';
  this.sessionExpiry = 14 * 24 * 60 * 60;
  this.dbHostname = 'localhost';
  this.dbPort = 5984;
  this.dbName = 'geddy';

  // Override with app-level opts
  var opts = require(dirname + '/config/config');
  for (var p in opts) {
    this[p] = opts[p];
  }
};

exports.Config = Config;
