
var Config = function (dirname) {
  this.environment = 'development';
  this.port = 8000;
  this.dirname = dirname;
  this.staticFilePath = this.dirname + '/public';
  this.sessionStore = 'memory';
  this.sessionIdKey = 'sid';
  this.sessionExpiry = 14 * 24 * 60 * 60;
};

exports.Config = Config;
