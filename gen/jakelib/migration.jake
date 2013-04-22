var utils = require('utilities')
  , fs = require('fs')
  , path = require('path')
  , genDirname = path.join(__dirname, '..')
  , Adapter = require('../../lib/template/adapters');

namespace('migration', function () {

  task('create', function (name) {
    var fileName = utils.string.snakeize(name)
      , ctorName = utils.string.camelize(fileName, {initialCap: true})
      , text = fs.readFileSync(path.join(genDirname, 'base',
            'migration.ejs'), 'utf8').toString()
      , adapter = new Adapter({engine: 'ejs', template: text})
      , templContent = adapter.render({ctorName: ctorName})
      , migrationDir = path.join('db', 'migrations');

    utils.file.mkdirP(migrationDir);
    fileName = utils.date.strftime(new Date(), '%Y%m%d%H%M%S') + '_' +
        fileName + '.js';
    fileName = path.join(migrationDir, fileName);
    fs.writeFileSync(fileName, templContent);
    console.log('[ADDED] ' + fileName);
  });

});

