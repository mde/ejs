var utils = require('utilities')
  , fs = require('fs')
  , path = require('path')
  , genDirname = path.join(__dirname, '..')
  , Adapter = require('../../lib/template/adapters').Adapter
  , Migration = require('model').Migration;

namespace('migration', function () {

  var FILE_PAT = /\.js$/;

  var createMigration = function (name, options) {
        var opts = options || {}
          , filename = utils.string.snakeize(name)
          , ctorName = utils.string.camelize(filename, {initialCap: true})
          , upCode = opts.upCode || ''
          , downCode = opts.downCode || ''
          , text = fs.readFileSync(path.join(genDirname, 'base',
                'migration.ejs'), 'utf8').toString()
          , adapter = new Adapter({engine: 'ejs', template: text})
          , templContent = adapter.render({
              ctorName: ctorName
            , upCode: upCode
            , downCode: downCode
            });
        return templContent;
      }
    , getFilename = function (name) {
        var filename = utils.string.snakeize(name);
        filename = utils.date.strftime(new Date(), '%Y%m%d%H%M%S') + '_' +
            filename + '.js';
        return filename;
      }
    , writeMigration = function (fn, templContent) {
        var migrationDir = path.join('db', 'migrations')
          , filename = path.join(migrationDir, fn);
        utils.file.mkdirP(migrationDir);
        fs.writeFileSync(filename, templContent);
        console.log('[Added] ' + filename);
      }
    , runMigrations = function (migrationList, direction, targetTimestampString,
          callback) {
        var doIt = function () {
              var migrationItem = migrationList.pop()
                , isNeeded = true
                , migrationItemTimestampString;
              if (migrationItem) {
                if (targetTimestampString) {
                  migrationItemTimestampString = migrationItem.split('_')[0];
                  if (direction == 'up') {
                    isNeeded = migrationItemTimestampString <= targetTimestampString;
                  }
                  else if (direction == 'down') {
                    isNeeded = migrationItemTimestampString > targetTimestampString;
                  }
                  else {
                    throw new Error('Migration direction must be up or down');
                  }
                }
                if (isNeeded) {
                  runMigration(migrationItem, direction, doIt);
                }
                else {
                  doIt();
                }
              }
              else {
                callback();
              }
            };
        doIt();
      }
    , runMigration = function (migration, direction, next) {
        var pathName = migration + '.js' // TODO: What about the Coffee crazies
        , inst
        , ctorName
        , ctor;

        // Pull off the date-stamp, get the underscoreized
        // migration-name
        ctorName = migration.split(/\d+_/)[1];
        console.log('Running ' + ctorName + ' (' + direction + ')');

        // Grab the exported migration ctor
        ctorName = geddy.string.camelize(ctorName, {initialCap: true});
        ctor = require(path.join(process.cwd(), '/db/migrations/',
            pathName))[ctorName];
        // Inherit all the Migration methods
        // TODO: Should this be a mixin to preserve statics?
        ctor.prototype = Object.create(Migration.prototype);
        inst = new ctor();
        // Hook up the DB adapter
        // TODO: API for using a different adapter if using multiple
        // SQL adapters?
        Migration.call(inst, ctorName, geddy.model.loadedAdapters.Migration);
        inst[direction](function () {
          var m;
          // Run it, up or down
          if (direction == 'up') {
            m = geddy.model.Migration.create({
              migration: migration
            });
            // Record it in the DB so it doesn't get run again
            m.save(function (err, data) {
              if (err) { throw err; }
              next();
            });
          }
          else if (direction == 'down') {
            geddy.model.Migration.remove({migration: migration},
                function (err, data) {
              if (err) { throw err; }
              next();
            });
          }
          else {
            throw new Error('Migration direction must be up or down');
          }
        });
      };

  task('create', function (name) {
    var templContent = createMigration(name, {
          upCode: "\n    next();"
        , downCode: "\n    next();"
        })
      , filename = getFilename(name);
    writeMigration(filename, templContent);
  });

  task('createForTable', function (name, props) {
    var templContent = ''
      , ctorName = utils.string.camelize(name, {initialCap: true})
      , filename
      , upCode = ['']
      , downCode = ['']

    ctorName = 'Create' + utils.inflection.pluralize(ctorName);

    upCode = upCode.concat([
      "    var def = function (t) {"
    ]);
    Object.keys(props).forEach(function (p) {
      var prop = props[p];
      // Ignore id field, auto-generated
      if (prop.name == 'id') {
        return;
      }
      upCode.push("          t.column('" +
          prop.name + "', '" + prop.type + "');");
    });
    upCode = upCode.concat([
      "        }"
    , "      , callback = function (err, data) {"
    , "          if (err) {"
    , "            throw err;"
    , "          }"
    , "          else {"
    , "            next();"
    , "          }"
    , "        };"
    , "    this.createTable('" + name + "', def, callback);"
    ]);
    upCode = upCode.join('\n');

    downCode = downCode.concat([
      "    var callback = function (err, data) {"
    , "          if (err) {"
    , "            throw err;"
    , "          }"
    , "          else {"
    , "            next();"
    , "          }"
    , "        };"
    , "    this.dropTable('" + name + "', callback);"
    ]);
    downCode = downCode.join('\n');

    filename = getFilename(ctorName);
    templContent = createMigration(ctorName, {
      upCode: upCode , downCode: downCode
    })
    writeMigration(filename, templContent);
  });

  // Creates two separate lists:
  // already-run migrations, and not-yet-run migrations
  task('filterMigrations', {async: true}, function () {
    var files = fs.readdirSync('db/migrations')
      , runnerTask
      , alreadyRunMigrations = []
      , notYetRunMigrations = [];

    geddy.model.Migration.all({}, {sort: 'migration'},
        function (err, data) {
      if (err) {
        throw err;
      }

      data.forEach(function (item) {
        alreadyRunMigrations.push(item.migration);
      });

      files.forEach(function (f) {
        if (FILE_PAT.test(f)) {
          var migr = f.replace(FILE_PAT, '');
          if (alreadyRunMigrations.indexOf(migr) == -1) {
            notYetRunMigrations.push(migr);
          }
        }
      });
      notYetRunMigrations.sort().reverse();
      complete({
        notYetRunMigrations: notYetRunMigrations
      , alreadyRunMigrations: alreadyRunMigrations
      });
    });


  });

  task('runMigrations', {async: true}, function (notYetRunMigrations,
      alreadyRunMigrations, targetTimestampString) {

      if (!notYetRunMigrations.length &&
          !(targetTimestampString && alreadyRunMigrations.length)) {
          console.log('(No migrations to run)');
          return complete();
      }

      runMigrations(notYetRunMigrations, 'up', targetTimestampString, function () {
        if (targetTimestampString) {
          runMigrations(alreadyRunMigrations, 'down', targetTimestampString, complete);
        }
        else {
          complete();
        }
      });
  });

  task('run', {async: true}, function (targetMigration) {
    console.log('Running migrations for ' + geddy.config.environment +
        ' environment...');
    var targetTimestampString = targetMigration ?
            targetMigration.split('_')[0] : null
      , finderTask = jake.Task['migration:filterMigrations']
      , runnerTask = jake.Task['migration:runMigrations'];
    finderTask.once('complete', function (vals) {
      runnerTask.once('complete', function () {
        complete();
      });
      runnerTask.invoke(vals.notYetRunMigrations, vals.alreadyRunMigrations,
          targetTimestampString);
    });
    finderTask.invoke();
  });

});

