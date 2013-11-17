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
      }

    , _getFrameworkPackageInfo = function () {
        var packagePath = path.join(__dirname,
                '../../node_modules/model/package.json')
          , packageFile = fs.readFileSync(packagePath).toString();
        return JSON.parse(packageFile);
      }

    , _getAppPackageInfo = function () {
        var packagePath = 'package.json'
          , packageFile = fs.readFileSync(packagePath).toString();
        return JSON.parse(packageFile);
      }

    , _writeAppPackageInfo = function (info) {
        var packagePath = 'package.json';
        fs.writeFileSync(packagePath, JSON.stringify(info, null, 2));
      }

    , _getAdapterInfo = function () {
        var adapters = require(path.join(__dirname,
                '../../node_modules/model/lib/adapters'))
          , adapter = adapters.getAdapterInfo(geddy.config.model.defaultAdapter);
        return adapter;
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
    var frameworkPackageInfo = _getFrameworkPackageInfo()
      , frameworkDevDeps = frameworkPackageInfo.devDependencies
      , appPackageInfo = _getAppPackageInfo()
      , appDeps = appPackageInfo.dependencies || {}
      , adapter = _getAdapterInfo()
      , lib
      , libVersion
      , cmd;

    if (!adapter) {
      fail('This environment has no valid DB adapter.');
    }

    console.log('Setting up DB support for ' + adapter.name +
        ' adapter, ' +
        geddy.config.environment + ' environment...');

    lib = adapter.lib;
    if (lib) {
      // Bail if the support lib is already there
      if (appDeps[lib]) {
        console.log(lib + ' lib found in app\'s package.json, skipping installation.');
        return complete();
      }
      // If not, add to package.json and install
      else {
        appDeps[lib] = frameworkDevDeps[lib];

        lib += '@' + frameworkDevDeps[lib];
        cmd = 'npm install ' + lib;

        console.log('Adding ' + lib + ' to app\'s package.json...');
        appPackageInfo.dependencies = appDeps;
        _writeAppPackageInfo(appPackageInfo);

        console.log('Installing ' + lib + '...');
        jake.exec(cmd, {printStdout: true}, function () {
          complete();
        });
      }
    }
    else {
      console.log('(Nothing to install.)');
      complete();
    }
  });

  task('init', ['db:install'], {async: true}, function () {
    var adapter = _getAdapterInfo()
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
