/*
Loads up and runs any code living in the app's local 'init' directory
*/

var path = require('path')
  , fs = require('fs')
  , utils = require('utilities');

exports.init = function (app, next) {
  var cwd = process.cwd()
    , dirList = fs.readdirSync(path.join(cwd, '/config'))
    , pat = /^init\.(js|coffee)$/
    , hasInitFile = false
    , fileName
    , initScript
    , initFunc;

  // `some` function does early return on a true result
  hasInitFile = dirList.some(function (item) {
    fileName = item;
    return pat.test(item);
  });

  // Load any init file
  if (hasInitFile) {
    // Fucking CoffeeScript
    if (fileName.indexOf('.coffee') > -1) {
      utils.file.requireLocal('coffee-script');
    }

    // Load and run the init script
    initScript = require(path.join(cwd, 'config', fileName));

    // If the file exports an `init` func, run it
    initFunc = initScript.init;
    if (typeof initFunc == 'function') {
      // If the func has a CPS 'next' param defined in the calling
      // signature, call it with next as a callback
      if (initFunc.length == 1) {
        initFunc.apply(initScript,[next]);
      }
      // If it's a sync function with no CPS 'next', just run it
      // and go next
      else {
        initFunc.apply(initScript);
        next();
      }
    }
    // No init func, all done
    else {
      next();
    }
  }
  // No init file, done here
  else {
    next();
  }

};

