// Load the basic Geddy toolkit
require('../../lib/geddy')

var cwd = process.cwd()
  , fs = require('fs')
  , path = require('path')
  , utils = require('../../lib/utils')
  , modelInit = require('../../lib/init/model')
  , Adapter = require('../../lib/template/adapters');

namespace('db', function () {

  task('createMigrationModel', ['env:init'], {async: true}, function () {
    var Migration = function () {
          this.property('migration', 'string');
        };
    // Create a model definition for Migrations
    Migration = geddy.model.register('Migration', Migration);
    // Get a DB adapter for this new model, and create its table
    modelInit.loadAdapterForModel(Migration, function () {
      var createTask = jake.Task['db:createTable'];
      createTask.once('complete', function () {
        complete();
      });
      createTask.invoke('Migration');
    });
  });

  task('createTable', ['env:init'], {async: true}, function (name) {

    var modelName
      , createTable
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

    createTable = function () {
      if ((m = modelNames.shift())) {

        // Make sure this is a correct model-name
        m = utils.string.getInflections(m).constructor.singular;
        if (!geddy.model[m]) {
          throw new Error(m + ' is not a known model.');
        }

        adapter = geddy.model.adapters[m];
        if (adapter) {
          console.log('Creating table for ' + m);
          adapter.createTable(m, function (err, data) {
            if (err) { throw err }
            createTable();
          });
        }
        else {
          createTable();
        }
      }
      else {
        complete();
      }
    };
    // Defer until associations are set up
    setTimeout(function () {
      createTable();
    }, 0);
  });

  task('init', ['env:init', 'createMigrationModel'], {async: true}, function () {
    var modelNames = Object.keys(geddy.model.descriptionRegistry)
      , createTask = jake.Task['db:createTable'];
      createTask.once('complete', function () {
        complete();
      });
      createTask.invoke(modelNames);
  });

  task('migrate', ['env:init'], {async: true}, function () {
  });

});
