
var Config = function (dirname) {
  this.environment = 'development';
  this.port = 8000;
  this.dirname = dirname;
  this.staticFilePath = this.dirname + '/public';
};

exports.Config = Config;
