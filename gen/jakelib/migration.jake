var utils = require('utilities')
  , fs = require('fs')
  , path = require('path')
  , genDirname = path.join(__dirname, '..')
  , Adapter = require('../../lib/template/adapters').Adapter;

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
        console.log('[ADDED] ' + filename);
      };

  task('create', function (name) {
    var templContent = createMigration(name)
      , filename = getFilename(name);
    writeMigration(filename, templContent);
  });

  task('createForTable', function (name, props) {
    var templContent = ''
      , upCode = ''
      , downCode = '';

    console.dir(props);

    Object.keys(props).forEach(function (p) {
      console.log(props[p]);
    });

    templContent = createMigration(name, {
      upCode: upCode
    , downCode: downCode
    })
    console.log(templContent);
  });

});

