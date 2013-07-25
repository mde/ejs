var utils = require('utilities')
  , fs = require('fs')
  , path = require('path')
  , genDirname = path.join(__dirname, '..')
  , Adapter = require('../../lib/template/adapters').Adapter
  , Migration = require('model').Migration;

namespace('migration', function () {

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

  task('findUnrun', {async: true}, function () {
    var files = fs.readdirSync('db/migrations')
      , runnerTask
      , unrunMigrations = []
      , findMigration = function () {
          var file = files.pop()
            , migration;
          if (file) {
            // Valid JS file
            // TODO: CoffeeScript crazies will want this
            if (/\.js$/.test(file)) {
              migration = file.replace(/\.js$/, '');
              // Is this migration already run and recorded?
              // Could do this as an 'in' lookup with an array, but this could
              // be a pretty big number of files -- likely better to iterate
              geddy.model.Migration.first({migration: migration},
                  function (err, data) {
                if (err) {
                  throw err;
                }
                // No match -- need to run this one
                if (!data) {
                  unrunMigrations.push(file);
                }
                // Next
                findMigration();
              });
            }
            // Can't do anything with this file -- just go next
            else {
              // Next
              findMigration();
            }
          }
          // No more files
          else {
            // Migrations to run, hand off to runner
            if (unrunMigrations.length) {
              unrunMigrations.sort();
              runnerTask = jake.Task['migration:runUnrun'];
              runnerTask.once('complete', function () {
                complete();
              });
              runnerTask.invoke(unrunMigrations);
            }
            // No un-run migrations, all done
            else {
              console.log('(No migrations to run)');
              complete();
            }
          }
        };
    findMigration();
  });

  task('runUnrun', {async: true}, function (unrunMigrations) {
    var runMigrations = function () {
          var migrationPath = unrunMigrations.shift()
            , migration
            , inst
            , ctorName
            , ctor;

          if (migrationPath) {
            migration = migrationPath.replace(/\.js$/, '');

            // Pull off the date-stamp, get the underscoreized
            // migration-name
            ctorName = migration.split(/\d+_/)[1];
            console.log('Running ' + ctorName);

            // Grab the exported migration ctor
            ctorName = geddy.string.camelize(ctorName, {initialCap: true});
            ctor = require(path.join(process.cwd(), '/db/migrations/',
                migration))[ctorName];
            // Inherit all the Migration methods
            // TODO: Should this be a mixin to preserve statics?
            ctor.prototype = Object.create(Migration.prototype);
            inst = new ctor();
            // Hook up the DB adapter
            // TODO: API for using a different adapter if using multiple
            // SQL adapters?
            inst.adapter = geddy.model.loadedAdapters.Migration;
            // Run it
            inst.up(function () {
              var m = geddy.model.Migration.create({
                migration: migration
              });
              // Record it in the DB so it doesn't get run again
              m.save(function (err, data) {
                if (err) { throw err; }
                runMigrations();
              });
            });
          }
          else {
            complete();
          }
        };
    runMigrations();
  });

  task('run', {async: true}, function () {
    console.log('Running migrations for ' + geddy.config.environment +
        ' environment...');
    finderTask = jake.Task['migration:findUnrun'];
    finderTask.once('complete', function () {
      complete();
    });
    finderTask.invoke();
  });

});

