var fs = require('fs')
  , path = require('path')
  , controller = require('../controller')
  , utils = require('../utils')
  , usingCoffee = false;

module.exports = new (function () {
    var JSPAT = /\.(js|coffee)$/;

    var _getDirList = function (dirname) {
          var cwd = process.cwd()
            , dirList = fs.readdirSync(dirname)
            , fileName
            , filePath
            , ctorName
            , ret = [];

          for (var i = 0; i < dirList.length; i++) {
            fileName = dirList[i];
            // Any files ending in '.js' or '.coffee'
            if (JSPAT.test(fileName)) {
              if (fileName.match(/\.coffee$/)) {
                // fileName is a CoffeeScript file so try to require it
                usingCoffee = usingCoffee || utils.file.requireLocal('coffee-script');
              }
              // Strip the extension from the file name
              fileName = fileName.replace(JSPAT, '');

              // Convert underscores to camelCase with
              // initial cap, e.g., 'NeilPearts'
              ctorName = geddy.string.camelize(fileName, {initialCap: true});
              filePath = path.join(cwd, dirname, fileName);
              ret.push({
                  ctorName: ctorName
                , filePath: filePath
              });
            }
          }
          return ret;
        };


  this.init = function (app, callback) {
    var controllerDir = 'app/controllers'
      , appCtorPath
      , dirList = _getDirList(controllerDir)
      , item
      , ctor
      , ctorActions;

    appCtorPath = path.join(process.cwd(), controllerDir, 'application.js');
    if (fs.existsSync(appCtorPath)) {
      ctor = require(appCtorPath).Application;
      ctor.origPrototype = ctor.prototype;
      controller.Application = ctor;
    }

    // Dynamically create controller constructors
    // from files in app/controllers
    for (var i = 0; i < dirList.length; i++) {
      item = dirList[i];
      ctor = require(item.filePath)[item.ctorName];
      ctor.origPrototype = ctor.prototype;
      if (item.ctorName != 'Application') {
        controller.register(item.ctorName, ctor);
      }
    }

    callback();
  };

})();

