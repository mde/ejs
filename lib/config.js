var config
  , path = require('path')
  , fs = require('fs')
  , utils = require('utilities')
  , ejs = require('./template/engines/ejs');

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
      , appEnvConfig
      , secretsFile = path.join(dir, 'config', 'secrets.json')
      , secrets
      , protocol
      , fullHostname;

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

    // Mix in any app-secrets
    if (utils.file.existsSync(secretsFile)) {
      secrets = fs.readFileSync(secretsFile).toString();
      // HACK, allow EJS in JSON, get env vars for deploy-from-Git
      secrets = ejs.render(secrets, {});
      try {
        // Parse into obj and mix in to config
        secrets = JSON.parse(secrets);
      }
      catch (e) {
        throw new Error('Could not parse secrets.json file, ' + e.message);
      }
      utils.mixin(ret, secrets);
    }

    // Obvious, don't rotate with only one worker
    if (ret.workers < 2) {
      ret.rotateWorkers = false;
    }

    // Construct fullHostname if not specifically set and there's a
    // usable hostname (i.e., not the 'any IPv4 address' option)
    if (!ret.fullHostname && ret.hostname) {
      protocol = ret.ssl ? 'https' : 'http';
      fullHostname = protocol + '://' + ret.hostname;
      if (ret.port != 80) {
        fullHostname += ':' + ret.port;
      }
      ret.fullHostname = fullHostname;
    }

    return ret;
  };

})();

module.exports = config;
