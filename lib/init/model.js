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

    , _getAdapterConfig = function (dbConfig, adapterName) {
      var info;
      for (var p in dbConfig) {
        // Return the first alias key recognized whose
        // canonical name is the same
        info = model.getAdapterInfo(p);
        if (info && info.name == adapterName) {
          return dbConfig[p];
        }
      }
    };

  this.loadAdapterForModel = function (modelItem, cb) {
    var builtinAdaptersPath = path.join(__dirname,
            '../../node_modules/model/lib/adapters')
      , cwd = process.cwd()
      , modelDir = path.join('app/models')
      , appAdaptersPath = path.join(cwd, modelDir, 'adapters')
      , adapterInfo
      , adapterPath
      , adapterName
      , adapterCtor
      , adapter
      , config
      , name = modelItem.modelName
      , done;

    adapterName = modelItem.adapter;
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
          adapterName = adapterInfo.name; // Get canonical name
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
      adapter = model.adapters[adapterName];
      done = function (adapter) {
        model.loadedAdapters[name] = adapter; // Backward compat, remove after 0.9
        model[name].adapter = adapter; // e.g. model.FooBar.adapter
        model.adapters[adapterName] = adapter; // e.g., model.adpaters.postgres
        cb();
      };
      if (!adapter) {
        config = _getAdapterConfig(geddy.config.db, adapterName);
        adapterCtor = require(adapterPath).Adapter;
        adapter = new adapterCtor(config);
        if (typeof adapter.connect == 'function') {
          adapter.connect(function () {
            return done(adapter);
          });
        }
        else {
          return done(adapter);
        }
      }
      else {
        return done(adapter);
      }
    }
  };

  this.init = function (app, callback) {
    var self = this
      , modelDir = path.join('app/models')
      , cwd = process.cwd()
      , doIt;

    // May be running totally model-less
    if (!utils.file.existsSync(path.join(cwd, modelDir))) {
      return callback();
    }

    // Set any model properties from the app config
    utils.mixin(model, geddy.config.model);

    models = utils._getConstructorsFromDirectory(modelDir);

    models.forEach(function (m) {
      // Requiring the file will register the model def if using the old way
      var mod = require(m.filePath);
      // Otherwise, look for an exported constructor with the right name
      m.ctor = mod[m.ctorName];
    });

    // Register all the models
    model.registerDefinitions(models);

    // Now load the adapters
    var doIt = function () {
      var m = models.shift()
        , modelItem
        , name;
      if (m) {
        // If the model doesn't exist, something is fucked up
        name = m.ctorName;
        if (!model[name]) {
          throw new Error('Model ' + name + ' did not get registered properly.');
        }

        modelItem = model[name];
        self.loadAdapterForModel(modelItem, doIt);
      }
      else {
        // All done
        callback();
      }
    };
    doIt();
  };

})();

