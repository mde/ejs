var fs = require('fs')
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString())
  , version = pkg.version
  , child_process = require('child_process')
  , path = require('path')
  , exec = child_process.exec
  , inflection = require('./deps/inflection')
  , utils = require('./lib/utils')
  , ejs = require('./lib/template/adapters/ejs/ejs');

namespace('gen', function () {

  var _writeTemplate = function (name, filename, dirname, opts) {
        var names = _getInflections(name)
          , text = fs.readFileSync(__dirname +
                '/templates/' + filename +'.ejs', 'utf8').toString()
          , templ
          , filePath;
        // Render with the right model name
        templ = new ejs.Template({text: text});
        templ.process({data: {names: names}});
        filePath = './app/' + dirname + '/' + names.filename[opts.inflection] + '.js';
        fs.writeFileSync(filePath, templ.markup, 'utf8');
        console.log('[ADDED] ' + filePath);
      }

    , _getInflections = function (nameParam) {
        var name = utils.string.snakeize(nameParam)
          , namePlural = inflection.pluralize(name)
          , names = {
            filename: {
              singular: name
            , plural: namePlural
            }
          , constructor: {
              singular: utils.string.camelize(name, true)
            , plural: utils.string.camelize(namePlural, true)
            }
          , property: {
              singular: utils.string.camelize(name)
            , plural: utils.string.camelize(namePlural)
            }
          };
        return names;
      };

  desc('Creates a new Geddy app scaffold.');
  task('app', [], function (appName) {
    if (!appName) {
      throw new Error('No app-name specified.');
    }
    var dir = appName
      , templateDir = __dirname + '/templates/base'
      , cmds = [
          'mkdir -p ./' + dir
        , 'mkdir -p ./' + dir + '/config'
        , 'mkdir -p ./' + dir + '/app/models'
        , 'mkdir -p ./' + dir + '/app/controllers'
        , 'mkdir -p ./' + dir + '/app/views'
        , 'mkdir -p ./' + dir + '/public'
        , 'mkdir -p ./' + dir + '/public/js'
        , 'mkdir -p ./' + dir + '/public/css'
        , 'mkdir -p ./' + dir + '/log'
        , 'cp ' + templateDir + '/router.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/init.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/environment.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/development.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/production.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/main.js ' + dir + '/app/controllers/'
        , 'cp ' + templateDir + '/application.js ' + dir + '/app/controllers/'
        , 'cp ' + templateDir + '/master.css ' + dir + '/public/css/'
        , 'cp ' + templateDir + '/favicon.ico ' + dir + '/public/'
        ];
    jake.exec(cmds, function () {
      console.log('Created app ' + dir + '.');
      complete();
    });
  }, true);

  desc('Creates a resource-based route with model and controller.');
  task('resource', function (name) {
    jake.Task['gen:model'].invoke(name);
    jake.Task['gen:controller'].invoke(name);
    jake.Task['gen:route'].invoke(name);
    jake.Task['gen:views'].invoke(name);
  });

  task('model', [], function (name) {
    _writeTemplate(name, 'resource_model', 'models',
        {inflection: 'singular'});
  });

  task('controller', [], function (name) {
    _writeTemplate(name, 'resource_controller', 'controllers',
        {inflection: 'plural'});
  });

  task('route', [], function (name, opts) {
    var names = _getInflections(name)
      , options = opts || {}
      , routeType = options.bare ? 'Bare' : 'Resource'
      , filePath = './config/router.js'
      , newRoute
      , text = fs.readFileSync(filePath, 'utf8').toString()
      , routeArr;

    if (options.bare) {
      newRoute = 'router.match(\'/' +  names.filename.plural +
          '\').to({controller: \'' + names.constructor.plural +
          '\', action: \'index\'});';
    }
    else {
      newRoute = 'router.resource(\'' +  names.filename.plural + '\');'
    }

    if (text.indexOf(newRoute) == -1) {
      // Add the new resource route just above the export
      routerArr = text.split('exports.router');
      routerArr[0] += newRoute + '\n';
      text = routerArr.join('exports.router');
      fs.writeFileSync(filePath, text, 'utf8');
      console.log(routeType + ' ' + names.filename.plural +
          ' route added to ' + filePath);
    }
    else {
      console.log('(' + routeType + ' ' + names.filename.plural +
          ' route already defined in ' + filePath + ')');
    }
  });

  task('views', [], function (name, opts) {
    var names = _getInflections(name)
      , options = opts || {}
      , viewDir = './app/views/' + names.filename.plural
      , actions
      , cmds = []
      , addActionView = function (action) {
          cmds.push('cp ' + __dirname + '/templates/views/' +
              action + '.html.ejs ' + viewDir + '/');
        };

    cmds.push('mkdir -p ' + viewDir);
    cmds.push('mkdir -p ./app/views/layouts');

    addActionView('index');
    // Add views for the other CRUD actions when doing a full-on resource
    if (!options.bare) {
      ['add', 'edit', 'show'].forEach(function (action) {
        addActionView(action);
      });
    }

    // Create an app-layout if one doesn't exist
    if (!path.existsSync(process.cwd() +
        '/app/views/layouts/application.html.ejs')) {
      cmds.push('cp  ' + __dirname + '/templates/views/layout.html.ejs ' +
          './app/views/layouts/application.html.ejs');
    }

    jake.exec(cmds, function () {
      console.log('Created view templates.');
    });
  });

  task('bareController', [], function (name) {
    _writeTemplate(name, 'bare_controller', 'controllers',
        {inflection: 'plural'});
    jake.Task['gen:route'].invoke(name, {bare: true});
    jake.Task['gen:views'].invoke(name, {bare: true});
  });

});

namespace('doc', function () {
  desc('Generate docs for Geddy');
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      if (stderr) {
        console.log(stderr);
      }
      if (stdout) {
        console.log(stdout);
      }
      console.log('Done.');
      complete();
    });
  }, true);

  desc('Clobber the generated docs.');
  task('clobber', function () {
    var cmd = 'rm -fr ./doc/*';
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      if (stderr) {
        console.log(stderr);
      }
      if (stdout) {
        console.log(stdout);
      }
      console.log('Clobbered old docs.');
      complete();
    });
  }, true);

});

// Don't generate the package-tasks when being called as a generator
// from an installed geddy -- don't run outside the geddy project dir
if (!process.env.generator) {
  var t = new jake.PackageTask('geddy', 'v' + version, function () {
    var fileList = [
      'Makefile'
    , 'Jakefile'
    , 'README.md'
    , 'package.json'
    , 'bin/*'
    , 'deps/*'
    , 'lib/*'
    , 'templates/*'
    ];
    this.packageFiles.include(fileList);
    this.needTarGz = true;
    this.needTarBz2 = true;
  });
}

