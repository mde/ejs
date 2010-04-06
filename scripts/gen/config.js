
var config = new function () {
  //this.environment = 'development';
  //this.port = 8000;
  this.plugins = [
    'auth/auth'
  ];
}();

for (var p in config) { this[p] = config[p]; }
