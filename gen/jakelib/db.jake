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

  task('install', ['env:model'], {async: true}, function () {
    var packagePath = path.join(__dirname,
            '../../node_modules/model/package.json')
      , packageFile = fs.readFileSync(packagePath).toString()
      , deps = JSON.parse(packageFile).devDependencies
      , adapters = require(path.join(__dirname,
            '../../node_modules/model/lib/adapters'))
      , adapter = adapters.getAdapterInfo(geddy.config.model.defaultAdapter)
      , lib
      , libVersion
      , cmd;

    // Hacky, save this where db:init can find it
    geddy.config.model.defaultAdapterInfo = adapter;

    if (!adapter) {
      fail('This environment has no valid DB adapter.');
    }

    console.log('Setting up DB support for ' + adapter.name +
        ' adapter, ' +
        geddy.config.environment + ' environment...');

    lib = adapter.lib;
    if (lib) {
      lib += '@' + deps[lib];
      cmd = 'npm install ' + lib;

      console.log('Installing ' + lib + '...');
      jake.exec(cmd, {printStdout: true}, function () {
        complete();
      });
    }
    else {
      console.log('(Nothing to install.)');
      complete();
    }
  });

  task('init', ['db:install'], {async: true}, function () {
    var adapter = geddy.config.model.defaultModelInfo // From db:install
      , createMigrationModelTask;

    if (!adapter) {
      fail('This environment has no valid DB adapter.');
    }

    // SQL DB -- set up for migrations
    if (adapter.type == 'sql') {
      createMigrationModelTask = jake.Task['db:createMigrationModel'];
      createMigrationModelTask.once('complete', function () {
        var modelName = 'Migration'
          , createTableTask = jake.Task['db:createTable'];

        console.log('Setting up Migrations for ' +
            geddy.config.environment + ' environment...');

        createTableTask.once('complete', function () {
          var dir = path.join(process.cwd(), 'db', 'migrations');
          console.log('Created ' + dir);
          jake.mkdirP(dir);
          complete();
        });
        createTableTask.invoke(modelName);
      });
      createMigrationModelTask.invoke();
    }
    // Non-relational, all done
    else {
      complete();
    }
  });

  // targetMigration can be a full migration-name, or the
  // timestamp prefix for a migration
  task('migrate', ['env:init', 'createMigrationModel'], {async: true},
      function (targetMigration) {
    var runTask = jake.Task['migration:run'];
    runTask.once('complete', function () {
      complete();
    });
    runTask.invoke(targetMigration);
  });

});
