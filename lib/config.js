var config
  , path = require('path')
  , fs = require('fs')
  , utils = require('utilities');

config = new (function () {

  this.readConfig = function (options) {
    var opts = options || {}
      , ret = {}
      , baseConfig
      , env
      , dir = process.cwd()
      , dirList = fs.readdirSync(path.join(dir, 'config'))
      , fileName
      , fileExt
      , fileBaseName
      , useCoffee
      , appBaseConfig
      , appEnvConfig;

    baseConfig = utils.mixin({}, require('./base_config'), true);
    env = opts.environment || baseConfig.environment;

    // Base config for workers-count should be 1 in dev-mode
    // Cycle based on filesystem changes, not keep-alive
    // Process-rotation not possible in this mode
    if (env == 'development') {
      baseConfig.workers = 1;
      baseConfig.rotateWorkers = false;
    }

    // App configs
    for (var i = 0; i < dirList.length; i++) {
      fileName = dirList[i];
      fileExt = path.extname(fileName);
      fileBaseName = path.basename(fileName, fileExt);
      // Require the environment configuration and the base configuration file
      if (fileBaseName === env || fileBaseName === 'environment') {
        if (fileExt === '.coffee') {
          // fileName is a CoffeeScript file so try to require it
          useCoffee = useCoffee || utils.file.requireLocal('coffee-script');
        }
        appBaseConfig = require(dir + '/config/environment');
        appEnvConfig = require(dir + '/config/' + env);
      }
    }

    // Start with a blank slate, mix everything in
    utils.mixin(ret, baseConfig, true);
    utils.mixin(ret, appBaseConfig, true);
    utils.mixin(ret, appEnvConfig, true);
    utils.mixin(ret, opts, true);

    // Obvious, don't rotate with only one worker
    if (ret.workers < 2) {
      ret.rotateWorkers = false;
    }

    return ret;
  };

})();

module.exports = config;
