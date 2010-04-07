
var config = new function () {
  /*
  this.environment = 'development';
  this.port = 8000;
  this.plugins = [
    'auth/auth'
  ];
  this.sessions = {
    store: 'couchdb',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60,
    dbHostname: 'localhost',
    dbName: 'geddy_sessions',
    dbPort: 5984
  };
  */
}();

for (var p in config) { this[p] = config[p]; }
