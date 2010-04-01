
var config = new function () {
  //this.environment = 'development';
  //this.port = 8000;
}();

for (var p in config) { this[p] = config[p]; }
