var model = require('model')
  , path = require('path')
  , useCoffee = false;

module.exports = new (function () {

  var _getAdapterPath = function (base, name) {
        var p = path.join(base, geddy.string.snakeize(name))
        , testPath;

        // Fucking CoffeeScript
        testPath = p + '.coffee';
        if (geddy.file.existsSync(testPath)) {
          useCoffee = useCoffee || geddy.file.requireLocal('coffee-script');
          return testPath;
        }
        // Normal JS
        testPath = p + '.js';
        if (geddy.file.existsSync(testPath)) {
          return testPath;
        }
        // Nothing found
        return null;
      }

  var _getAdapterConfig = function (dbConfig, adapterName) {
    var info;
    for (var p in dbConfig) {
      // Return the first alias key recognized whose
      // canonical name is the same
      info = model.getAdapterInfo(p);
      if (info && info.name == adapterName) {
        return dbConfig[p];
      }
    }
  }

  this.init = function (app, callback) {
    var modelDir = path.join('app/models')
      , cwd = process.cwd()
      , builtinAdaptersPath = path.join(__dirname,
            '../../node_modules/model/lib/adapters')
      , appAdaptersPath = path.join(cwd, modelDir, 'adapters')
      , ctors;

    // May be running totally model-less
    if (!geddy.file.existsSync(path.join(cwd, modelDir))) {
      return callback();
    }

    // Set any model properties from the app config
    geddy.mixin(model, geddy.config.model);

    models = geddy._getConstructorsFromDirectory(modelDir);
    models.forEach(function (m) {
      var name = m.ctorName
        , filePath = m.filePath
        , adapterInfo
        , adapterPath
        , adapterName
        , adapterCtor
        , adapter
        , config;

      require(filePath);

      // If the model doesn't exist, something is fucked up
      if (!model[name]) {
        throw new Error('Model ' + name + ' did not get registered properly.');
      }

      adapterName = model[name].adapter;
      // Is there a specific adapter defined for this model item?
      if (adapterName) {
        // See if it's a custom in-app adapter
        adapterPath = _getAdapterPath(appAdaptersPath, adapterName);
        // Try again, see if there's a built-in adapter
        if (!adapterPath) {
          adapterInfo = model.getAdapterInfo(adapterName);
          if (adapterInfo) {
            adapterName = adapterInfo.name;
            adapterPath = _getAdapterPath(builtinAdaptersPath, adapterInfo.filePath);
          }
        }
      }
      else {
        // Look for a default adapter
        adapterName = model.defaultAdapter;
        if (adapterName) {
          adapterInfo = model.getAdapterInfo(adapterName);
          if (adapterInfo) {
            adapterName = adapterInfo.name;
            adapterPath =
                _getAdapterPath(builtinAdaptersPath, adapterInfo.filePath);
          }
        }
      }

      // No adapter, log an error
      if (!adapterPath) {
        geddy.log.info('Model adapter not found for ' + name +
            '. Set .adapter for this model, or set model.defaultAdapter.');
      }
      else {
        adapter = model.loadedAdapters[adapterName];
        if (!adapter) {
          config = _getAdapterConfig(geddy.config.db, adapterName);
          adapterCtor = require(adapterPath).Adapter;
          adapter = new adapterCtor(config);
          if (typeof adapter.connect == 'function') {
            adapter.connect();
          }
          model.loadedAdapters[adapterName] = adapter;
          if (typeof adapter.createTable == 'function') {
            // FIXME -- fire-and-forget bad, need to make this
            // recursive
            adapter.createTable(name, function () {});
          }
        }
        model.adapters[name] = adapter;
      }

    });
    callback();
  };

})();

