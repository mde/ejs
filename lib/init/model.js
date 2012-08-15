var model = require('model')
  , path = require('path')
  , utils = require('utilities')
  , useCoffee = false;

module.exports = new (function () {

  var _getAdapterPath = function (base, name) {
        var p = path.join(base, utils.string.snakeize(name))
        , testPath;

        // Fucking CoffeeScript
        testPath = p + '.coffee';
        if (utils.file.existsSync(testPath)) {
          useCoffee = useCoffee || utils.file.requireLocal('coffee-script');
          return testPath;
        }
        // Normal JS
        testPath = p + '.js';
        if (utils.file.existsSync(testPath)) {
          return testPath;
        }
        // Nothing found
        return null;
      }

  this.init = function (callback) {
    var modelDir = path.join('app/models')
      , cwd = process.cwd()
      , builtinAdaptersPath = path.join(__dirname,
            '../../node_modules/model/lib/adapters')
      , appAdaptersPath = path.join(cwd, modelDir, 'adapters')
      , ctors;

    // FIXME: Do this in app.js
    utils.log.registerLogger(geddy.log);

    // May be running totally model-less
    if (!utils.file.existsSync(path.join(cwd, modelDir))) {
      return callback();
    }

    // Set any model properties from the app config
    utils.mixin(model, geddy.config.model);

    models = utils._getConstructorsFromDirectory(modelDir);
    models.forEach(function (m) {
      var name = m.ctorName
        , filePath = m.filePath
        , adapterInfo
        , adapterPath
        , adapterName
        , adapterCtor
        , adapter;

      require(filePath);

      // If the model doesn't exist, something is fucked up
      if (!model[name]) {
        throw new Error('Model ' + m.ctorName + ' did not get registered properly.');
      }

      adapterName = model[name].adapter;
      // There's an adapter defined for this model item
      if (adapterName) {
        // See if it's a custom in-app adapter
        if ((adapterPath = _getAdapterPath(appAdaptersPath, adapterName))) {
          model.adapters[name] = require(adapterPath)[adapterName];
        }
        // Try again, see if there's a built-in adapter
        else if ((adapterInfo = model.getAdapterInfo(adapterName))) {
          adapter = model.adapters[name];
          if (!adapter) {
            adapterPath = _getAdapterPath(builtinAdaptersPath, adapterInfo.filePath);
            adapterCtor = require(adapterPath).Adapter;
            adapter = new adapterCtor(geddy.config.db);
            model.loadedAdapters[adapterInfo.name] = adapter;
          }
          model.adapters[name] = adapter;
        }
        else {
          // Maybe it's a default/builtin
          adapterName = geddy.config.adapters && geddy.config.adapters['default'];
          if ((adapterInfo = model.getAdapterInfo(adapterName))) {
            adapterPath = _getAdapterPath(builtinAdaptersPath, adapterInfo.filePath);
            model.adapters[name] = require(adapterPath)[adapterInfo.name]
          }
          // No adapter, log an error
          else {
            geddy.log.error('Adapter not found for ' + name +
                '. Make sure your adapter is in app/models/adapters');
          }
        }
      }
    });
    callback();
  };

})();

