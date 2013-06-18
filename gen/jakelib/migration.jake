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
          upCode: "    next();"
        , downCode: "    next();"
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

  task('run', {async: true}, function () {
    var files = fs.readdirSync('db/migrations')
      , unrunMigrations = []
      , findMigration = function () {
          var file = files.pop()
            , migration;
          if (file && /\.js$/.test(file)) {
            migration = file.replace(/\.js$/, '');
            geddy.model.Migration.first({migration: migration},
                function (err, data) {
              if (err) {
                throw err;
              }
              if (!data) {
                unrunMigrations.push(file);
              }
              findMigration();
            });
          }
          else {
            if (unrunMigrations.length) {
              unrunMigrations.sort();
              runMigrations();
            }
            else {
              console.log('(No migrations to run)');
              complete();
            }
          }
        }
      , runMigrations = function () {
          var migrationPath = unrunMigrations.shift()
            , migration
            , inst
            , ctorName
            , ctor;

          if (migrationPath) {
            migration = migrationPath.replace(/\.js$/, '');

            // Pull off the date-stamp
            ctorName = migration.split(/\d+_/)[1];
            console.log('Running ' + ctorName);

            ctorName = geddy.string.camelize(ctorName, {initialCap: true});

            ctor = require(path.join(process.cwd(), '/db/migrations/',
                migration))[ctorName];
            ctor.prototype = Object.create(Migration.prototype);
            inst = new ctor();
            inst.adapter = geddy.model.loadedAdapters.Migration;
            inst.up(function () {
              var m = geddy.model.Migration.create({
                migration: migration
              });
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
    console.log('Running migrations for ' + geddy.config.environment +
        ' environment...');
    findMigration();
  });

});

