// Load the basic Geddy toolkit
require('./lib/geddy')

var fs = require('fs')
  , child_process = require('child_process')
  , path = require('path')
  , exec = child_process.exec
  , inflection = require('./deps/inflection')
  , utils = require('./lib/utils')
  , Templato = require('./deps/templato')
  , ejs = require('./lib/template/adapters/ejs')
  , createPackageTask;

var JSPAT = /\.js$/;

namespace('gen', function () {
  var _writeTemplate = function (name, filename, dirname, opts) {
        var templato = new Templato
          , names = _getInflections(name)
          , text = fs.readFileSync(path.join(__dirname,
                'templates', filename +'.ejs'), 'utf8').toString()
          , templ
          , filePath;
        // Render with the right model name
        templ = new ejs.Template({text: text, templato: templato});
        templ.process({data: {names: names}});
        filePath = path.join('app', dirname,
            names.filename[opts.inflection] + '.js');
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

  // Creates a new Geddy app scaffold
  task('app', [], function (appName) {
    if (!appName) {
      throw new Error('No app-name specified.');
    }
    var mkdirs = [
          ''
        , 'config'
        , 'app/models'
        , 'app/controllers'
        , 'lib'
        , 'log'
        , 'node_modules'
        ]
      , cps = [
        , ['views', 'app']
        , ['public', '']
        , ['router.js', 'config']
        , ['init.js', 'config']
        , ['environment.js', 'config']
        , ['development.js', 'config']
        , ['production.js', 'config']
        , ['main.js', 'app/controllers']
        , ['application.js', 'app/controllers']
        , ['favicon.ico', 'public']
        ];
    mkdirs.forEach(function (d) {
      jake.mkdirP(path.join(appName, d));
    });
    cps.forEach(function (cp) {
      jake.cpR(path.join(__dirname, 'templates/base', cp[0]),
          path.join(appName, cp[1]));
    });
    console.log('Created app ' + appName + '.');
  });

  // Creates a resource-based route with model and controller
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
      , filePath = path.normalize('config/router.js')
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

    // Don't add the same route over and over
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
      , viewDir = path.join('app/views', names.filename.plural)
      , actions
      , cmds = []
      , addActionView = function (action) {
          jake.cpR(path.join(__dirname, 'templates/views',
              action + '.html.ejs'), viewDir);
        };

    jake.mkdirP(viewDir);
    jake.mkdirP('app/views/layouts');

    addActionView('index');
    // Add views for the other CRUD actions when doing a full-on resource
    if (!options.bare) {
      ['add', 'edit', 'show'].forEach(function (action) {
        addActionView(action);
      });
    }

    // Create an app-layout if one doesn't exist
    if (!path.existsSync(path.join(process.cwd(),
        'app/views/layouts/application.html.ejs'))) {
      jake.cpR(path.join(__dirname, '/templates/views/layout.html.ejs'),
          'app/views/layouts/application.html.ejs');
    }

    console.log('Created view templates.');
  });

  task('bareController', [], function (name) {
    _writeTemplate(name, 'bare_controller', 'controllers',
        {inflection: 'plural'});
    jake.Task['gen:route'].invoke(name, {bare: true});
    jake.Task['gen:views'].invoke(name, {bare: true});
  });

  task('secret', [], function (name) {
    var filename = path.join(process.cwd(), 'config/environment.js')
      , conf = fs.readFileSync(filename).toString()
      , confArr
      , secret = utils.string.uuid(128);

    // Remove any old secret
    conf = conf.replace(/\nconfig.secret.+;\n/, '');

    confArr = conf.split('module.exports = config;');
    conf = confArr[0] + "config.secret = '" + secret + "';\n\n" +
      'module.exports = config;' + confArr[1];
    fs.writeFileSync(filename, conf);
    console.log('app-secret added to environment.js config.');
  });

});

namespace('doc', function () {
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    jake.exec([cmd], function () {
      console.log('Done.');
      complete();
    });
  }, {async: true});

  task('clobber', function () {
    var cmd = 'rm -fr ./doc/**';
    jake.exec([cmd], function () {
      console.log('Clobbered old docs.');
      complete();
    });
  }, {async: true});

});

desc('Generate docs for Geddy');
task('doc', ['doc:generate']);


desc('Runs the tests.');
task('test', function () {
  var dir = process.cwd()
    , dirList = fs.readdirSync(dir + '/test')
    , fileName
    , cmds = [];
  for (var i = 0; i < dirList.length; i++) {
    fileName = dirList[i];
    // Any files ending in '.js'
    if (JSPAT.test(fileName)) {
      cmds.push('node ./test/' + fileName);
    }
  }
  jake.exec(cmds, function () {
    console.log('Tests passed.');
    complete();
  }, {stdout: true});
}, {async: true});

var p = new jake.NpmPublishTask('geddy', [
  'Makefile'
, 'Jakefile'
, 'README.md'
, 'package.json'
, 'bin/**'
, 'deps/**'
, 'lib/**'
, 'templates/**'
, 'test/**'
]);

// Don't create the package-tasks when being called as a generator
if (!process.env.generator) {
  jake.Task['npm:definePackage'].invoke();
}

