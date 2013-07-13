// Load the basic Geddy toolkit
require('../../lib/geddy')

var cwd = process.cwd()
  , fs = require('fs')
  , path = require('path')
  , utils = require('../../lib/utils')
  , modelInit = require('../../lib/init/model')
  , Adapter = require('../../lib/template/adapters');

namespace('db', function () {

  var createOrDrop = function (action, name, cb) {
    var msg = action == 'create' ? 'Creating' : 'Dropping'
      , modelName
      , doAction
      , adapters
      , adapter;

    if (typeof name == 'string') {
      if (name.indexOf('%') > -1) {
        modelNames = name.split('%');
      }
      else {
        modelNames = [name];
      }
    }
    else {
      modelNames = name;
    }

    doAction = function () {
      if ((m = modelNames.shift())) {

        // Make sure this is a correct model-name
        m = utils.string.getInflections(m).constructor.singular;
        if (!geddy.model[m]) {
          throw new Error(m + ' is not a known model.');
        }

        adapter = geddy.model[m].adapter;
        if (adapter) {
          console.log(msg + ' table for ' + m);
          adapter[action + 'Table'](m, function (err, data) {
            if (err) { throw err }
            doAction();
          });
        }
        else {
          doAction();
        }
      }
      else {
        complete();
      }
    };
    // Defer until associations are set up
    setTimeout(function () {
      doAction();
    }, 0);
  };

  task('dropTable', ['env:init', 'createMigrationModel'], {async: true},
      function (name) {
    createOrDrop('drop', name, complete);
  });

  task('createTable', ['env:init', 'createMigrationModel'], {async: true},
      function (name) {
    createOrDrop('create', name, complete);
  });

  task('createMigrationModel', ['env:init'], {async: true}, function () {
    var Migration = function () {
          this.property('migration', 'string');
        };
    // Create a model definition for Migrations
    Migration = geddy.model.register('Migration', Migration);
    // Get a DB adapter for this new model, and create its table
    modelInit.loadAdapterForModel(Migration, function () {
      complete();
    });
  });

  task('init', ['env:init', 'createMigrationModel'], {async: true}, function () {
    var modelName = 'Migration'
      , createTask = jake.Task['db:createTable'];

      console.log('Initializing DB for ' + geddy.config.environment + ' environment...');
      if (geddy.model.defaultAdapter == 'memory') {
        fail('Please set geddy.model.defaultAdapter to use a SQL adapter');
      }

      createTask.once('complete', function () {
        var dir = path.join(process.cwd(), 'db', 'migrations');
        console.log('Created ' + dir);
        jake.mkdirP(dir);
        complete();
      });
      createTask.invoke(modelName);
  });

  task('migrate', ['env:init', 'createMigrationModel',
      'migration:run'], function () {});

});
