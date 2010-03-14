var fs = require('fs');
var fleegix = require('./fleegix');

var Config = function (dirname) {
  this.appDir = dirname;
  this.router = require(this.appDir + '/config/router').router;
  
  var dirList = fs.readdirSync(this.appDir + '/app/controllers');
  var fileName, controllerName;
  var controllers = {};
  var jsPat = /\.js$/;

  for (var i = 0; i < dirList.length; i++) {
    fileName = dirList[i];
    if (jsPat.test(fileName)) {
      fileName = fileName.replace(jsPat, '');
      controllerName = fleegix.string.camelize(fileName);
      controllerName = fleegix.string.capitalize(controllerName);
      controllers[controllerName] = require('../app/controllers/' + fileName)[controllerName];
    }
  }
  
  this.controllers = controllers;
}

exports.Config = Config;
