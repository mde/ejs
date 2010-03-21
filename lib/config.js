var fs = require('fs');
var fleegix = require('geddy/lib/fleegix');

var environments = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
};

var Config = function (dirname) {
  this.environment = environments.DEVELOPMENT;
  this.dirname = dirname;
  this.router = require(this.dirname + '/config/router').router;
  this.staticFilePath = this.dirname + '/public';
  
  var dirList = fs.readdirSync(this.dirname + '/app/controllers');
  var fileName, controllerName;
  var controllers = {};
  var jsPat = /\.js$/;

  // Dynamically create controller constructors from files in controllers/
  for (var i = 0; i < dirList.length; i++) {
    fileName = dirList[i];
    // Any files ending in '.js' -- e.g., 'neil_pearts.js'
    if (jsPat.test(fileName)) {
      // Strip the '.js', e.g., 'neil_pearts'
      fileName = fileName.replace(jsPat, '');
      // Convert underscores to camelCase, e.g., 'neilPearts'
      controllerName = fleegix.string.camelize(fileName);
      // Capitalize the first letter, e.g., 'NeilPearts'
      controllerName = fleegix.string.capitalize(controllerName);
      // Registers as a controller, e.g., controllers.NeilPearts =
      //    require('/path/to/geddy_app/app/controllers/neil_pearts').NeilPearts
      controllers[controllerName] = require(this.dirname +
          '/app/controllers/' + fileName)[controllerName];
    }
  }
  
  this.controllers = controllers;
}

exports.Config = Config;
exports.environments = environments;
