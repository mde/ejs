var fs = require('fs')
  , child_process = require('child_process')
  , path = require('path')
  , exec = child_process.exec
  , inflection = require('./deps/inflection')
  , utils = require('./lib/utils')
  , ejs = require('./lib/template/adapters/ejs/ejs')
  , createPackageTask
  , getCurrentVersionNumber;

var JSPAT = /\.js$/;

getCurrentVersionNumber = function () {
  pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString())
  version = pkg.version
  return version;
};

createPackageTask = function () {
  var version = getCurrentVersionNumber()
    , t;

  t = new jake.PackageTask('geddy', 'v' + version, function () {
    var fileList = [
        'Makefile'
      , 'Jakefile'
      , 'README.md'
      , 'package.json'
      , 'bin/*'
      , 'deps/*'
      , 'lib/*'
      , 'templates/*'
      , 'test/*'
      ];
    this.packageFiles.include(fileList);
    this.needTarGz = true;
  });
};

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
        , 'mkdir -p ./' + dir + '/lib'
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
  }, {async: true});

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

  task('secret', [], function (name) {
    var filename = process.cwd() + '/config/environment.js'
      , conf = fs.readFileSync(filename).toString()
      , confArr
      , secret = utils.string.uuid(128);

    // Remove any old secret
    conf = conf.replace(/\nconfig.secret.+;\n/, '');

    confArr = conf.split('module.exports = config;');
    conf = confArr[0] + "config.secret = '" + secret + "';\n\n" +
      'module.exports = config;' + confArr[1];
    fs.writeFileSync(filename, conf);
    console.log('secret added to environment.js config.');
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
  }, {async: true});

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
  }, {async: true});

});

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

namespace('npm', function () {
 task('version', function () {
    cmds = [
      'npm version patch --message "Bumped version number."'
    , 'git push origin master'
    , 'git push --tags'
    ];
    jake.exec(cmds, function () {
      console.log('Bumped version number.');
      complete();
    });
  }, {async: true});

  task('package', function () {
    // Recreate the PackageTask with the updated version-number,
    // run 'package'
    createPackageTask();
    // FIXME: Shouldn't have to shell out to get a real prereqs-tree
    jake.exec(['jake package'], function () {
      console.log('Created package.');
      complete();
    });

  }, {async: true});

  task('publish', function () {
    var version = getCurrentVersionNumber();
    cmds = [
      'sudo npm publish pkg/geddy-v' + version + '.tar.gz'
    ];
    // Hackity hack -- NPM publish sometimes returns errror like:
    // Error sending version data\nnpm ERR!
    // Error: forbidden 0.2.4 is modified, should match modified time
    setTimeout(function () {
      jake.exec(cmds, function () {
        console.log('Published to NPM.');
        complete();
      }, {stdout: true});
    }, 5000);
  }, {async: true});
});

desc('Bump version-number, package, and publish to NPM.');
task('publish', ['npm:version', 'npm:package', 'npm:publish'], function () {
});

// Don't create the package-tasks when being called as a generator
if (!process.env.generator) {
  createPackageTask();
}

