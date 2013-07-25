// Load the basic Geddy toolkit
require('../../lib/geddy')

// Dependencies
var cwd = process.cwd()
  , fs = require('fs')
  , path = require('path')
  , utils = require('../../lib/utils')
  , Adapter = require('../../lib/template/adapters').Adapter
  , helpers = require('./helpers')
  , mixinJSONData = helpers.mixinJSONData
  , getRouterPath = helpers.getRouterPath
  , getRoutes = helpers.getRoutes
  , addRoute = helpers.addRoute
  , genDirname = path.join(__dirname, '..');

namespace('gen', function () {

  var _writeTemplate = function (name, filename, dirname, opts) {
    var options = opts || {}
      , names = utils.string.getInflections(name)
      , text = fs.readFileSync(path.join(genDirname, filename + '.ejs'), 'utf8').toString()
      , bare = options.bare || false // Default to full controller
      , adapter
      , templContent
      , fileDir
      , filePath;

    // Render with the right model name
    adapter = new Adapter({engine: 'ejs', template: text});
    templContent = adapter.render({names: names, bare: bare, properties: options.properties});

    // Write file
    fileDir = dirname;
    if (!utils.file.existsSync(fileDir)) {
      fs.mkdirSync(fileDir);
    }

    filePath = path.join(fileDir, names.filename[options.inflection] + '.js');
    fs.writeFileSync(filePath, templContent, 'utf8');

    console.log('[Added] ' + filePath);
  };

  var _formatModelProperties = function (properties) {
    var obj = {default: {name: '', type: ''}};
    if (!properties) {
      return obj;
    }
    obj['default'].name = 'id';
    obj['default'].type = 'string';

    var itemsArr = properties.split('%')
      , name
      , type
      , args
      , i
      , value;

    i = -1;
    while (++i < itemsArr.length) {
      value = itemsArr[i];
      name = utils.string.camelize(value.replace(/:.*/g, ''));
      type = value.replace(/[a-zA-Z]*:?/, '');
      args = type.replace(/[a-zA-Z]*:?/, '');

      // Take off any args on the type
      type = type.replace(/:.*/g, '');

      // Defaults and aliases
      if (!type) {
        type = 'string';
      }
      if (args === 'def') {
        args = 'default';
      }

      switch (type) {
        case 'integer':
          type = 'int';
          break;
        case 'bool':
          type = 'boolean';
          break;
        case 'default':
        case 'def':
          type = 'string';
          args = 'default';
          break;
      }

      // Manage properties that deal with changing default properties
      if (args === 'default') {
        // Reset old default property to its own property, only if it's not
        // already the default
        if (name !== obj['default'].name) {
          // If the new default item already exists then delete it
          if (obj[name]) {
            delete obj[name];
          }

          obj[obj['default'].name] = obj[obj['default'].name] || obj['default'];
        }

        // Add new default property
        obj['default'] = {name: name, type: type};
        continue;
      }

      // If ID property is given and it matches the default
      // then rewrite the default with the new ID property
      if (name === 'id' && obj['default'].name === 'id') {
        obj['default'] = {name: name, type: type};
        continue;
      }

      // If the name is name or title then set them to default, otherwise add
      // the property normally
      if (name === 'name' || name === 'title') {
        // Reset old default to its own property
        obj[obj['default'].name] = obj[obj['default'].name] || obj['default'];

        // Add new default property
        obj['default'] = {name: name, type: type};
      } else {
        obj[name] = {name: name, type: type};
      }
    }

    return obj;
  };

  // Creates a new Geddy app scaffold
  task('app', function (name, engine, realtime) {
    var basePath = path.join(genDirname, 'base')
      , mkdirs
      , cps
      , text
      , adapter;

    if (!name) {
      throw new Error('No app name specified.');
    }
    if (!engine || engine == 'default') {
      engine = 'ejs';
    }
    if (realtime == 'default') {
      realtime = false;
    }

    mkdirs = [
      ''
    , 'config'
    , 'app/models'
    , 'app/controllers'
    , 'app/helpers'
    , 'lib'
    , 'log'
    , 'node_modules'
    , 'test/models'
    , 'test/controllers'
    ];
    cps = [
      (realtime) ? ['realtime/views/' + engine, 'app/views'] : ['views/' + engine, 'app/views']
    , ['public', '']
    , ['router.js', 'config']
    , ['init.js', 'config']
    , (realtime) ? ['realtime/environment.js', 'config'] : ['environment.js', 'config']
    , ['development.js', 'config']
    , ['production.js', 'config']
    , ['secrets.json', 'config']
    , ['main.js', 'app/controllers']
    , ['application.js', 'app/controllers']
    , ['favicon.ico', 'public']
    , ['gitignore.txt', '.gitignore']
    ];

    mkdirs.forEach(function (dir) {
      jake.mkdirP(path.join(name, dir));
    });
    cps.forEach(function (cp) {
      jake.cpR(path.join(basePath, cp[0]), path.join(name, cp[1]), {silent: true});
    });

    // one offs
    if (realtime) {
      jake.cpR(path.join(genDirname, '..', 'node_modules', 'socket.io' ), path.join(name, 'node_modules'), {silent: true});
    }

    // Compile Jakefile
    text = fs.readFileSync(path.join(basePath, 'Jakefile.ejs'), 'utf8').toString();
    adapter = new Adapter({engine: 'ejs', template: text});
    fs.writeFileSync(path.join(name, 'Jakefile'), adapter.render({appName: name}), 'utf8');

    // Compile package.json
    text = fs.readFileSync(path.join(basePath, 'package.json.ejs'), 'utf8').toString();
    adapter = new Adapter({engine: 'ejs', template: text});
    fs.writeFileSync(path.join(name, 'package.json'), adapter.render({appName: name}), 'utf8');

    // Add engine to package.json if it's not EJS
    if (engine !== 'ejs') {
      // Change to handlebars as we use it behind the scenes
      if (engine === 'mustache') {
        engine = 'handlebars';
      }
      var data = {dependencies: {}};
      data.dependencies[engine] = "*";

      mixinJSONData(path.join(name, 'package.json'), data);
    }

    console.log('Created app ' + name + '.');
  });

  // Creates a resource with a model, controller and a resource route
  task('resource', function (name, modelProperties) {
    var names
      , modelTask = jake.Task['gen:model'];

    if (!name) {
      throw new Error('No resource name specified.');
    }

    modelTask.on('complete', function () {
      jake.Task['gen:controller'].invoke(name);
      jake.Task['gen:route'].invoke(name);
      jake.Task['gen:test'].invoke(name,
          {properties: modelProperties});
      names = utils.string.getInflections(name);
      // Create views folder but not actions
      jake.mkdirP(path.join('app', 'views', names.filename.plural));
      console.log('[Added] ' + names.filename.plural + ' view directory');
      complete();
    });
    modelTask.invoke(name, modelProperties);

  }, {async: true});

  // Creates a full scaffold with views, a model, controller and a resource route
  task('scaffold', function (name, modelProperties, engine, realtime) {
    var modelTask = jake.Task['gen:model'];

    if (!name) {
      throw new Error('No scaffold name specified.');
    }
    if (!engine || engine == 'default') {
      engine = 'ejs';
    }
    if (!realtime || realtime == 'default') {
      realtime = false;
    }

    modelTask.on('complete', function () {
      jake.Task['gen:test'].invoke(name,
          {properties: modelProperties});
      jake.Task['gen:controllerScaffold'].invoke(name,
          {properties: modelProperties});
      jake.Task['gen:route'].invoke(name);
      jake.Task['gen:viewsScaffold'].invoke(name,
          {engine: engine, properties: modelProperties, realtime: realtime});
      complete();
    });
    modelTask.invoke(name, modelProperties, 'scaffold');

  }, {async: true});

  task('model', {async: true}, function (name, properties, modelPath) {
    var props = _formatModelProperties(properties)
      , createTableTask;
    if (!name) {
      throw new Error('No model name specified.');
    }
    if (!modelPath) {
      modelPath = 'resource';
    }
    modelPath += '/model';

    _writeTemplate(name, modelPath, path.join('app', 'models'), {
        inflection: 'singular'
      , properties: props
    });

    // Create the corresponding migration
    createTableTask = jake.Task['migration:createForTable'];
    createTableTask.on('complete', function () {
      complete();
    });
    createTableTask.invoke(name, props);


  });

  task('controller', function (name) {
    if (!name) {
      throw new Error('No controller name specified.');
    }


    _writeTemplate(name, 'resource/controller', path.join('app', 'controllers'),
        {inflection: 'plural', bare: false});
  });

  task('test', function (name) {
    if (!name) {
      throw new Error('No test name specified.');
    }

    _writeTemplate(name, 'resource/test_model', 'test/models',
        {inflection: 'singular'});
    _writeTemplate(name, 'resource/test_controller', 'test/controllers',
        {inflection: 'plural'});
  });

  task('controllerScaffold', function (name, options) {
    if (!name) {
      throw new Error('No controller name specified.');
    }
    options = options || {};

    _writeTemplate(name, 'scaffold/controller', path.join('app', 'controllers'), {
        inflection: 'plural'
      , bare: false
      , properties: _formatModelProperties(options.properties)
    });
  });

  task('bareController', function (name, engine) {
    if (!name) {
      throw new Error('No controller name specified.');
    }
    if (!engine || engine == 'default') {
      engine = 'ejs';
    }

    _writeTemplate(name, 'resource/controller', path.join('app', 'controllers'),
        {inflection: 'plural', bare: true});
    jake.Task['gen:route'].invoke(name, {bare: true});
    jake.Task['gen:views'].invoke(name, {bare: true, engine: engine});
  });

  task('route', function (name, options) {
    if (!name) {
      throw new Error('No route name specified.');
    }
    options = options || {};

    var names = utils.string.getInflections(name)
      , routerPath = getRouterPath()
      , routeType = options.bare ? 'Bare' : 'Resource'
      , newRoute;

    if (routerPath) {
      if (routerPath.match('.coffee')) {
        if (options.bare) {
          newRoute = 'router.match(\'/' +  names.filename.plural +
            '\').to controller: \'' + names.constructor.plural +
            '\', action: \'index\'';
        } else {
          newRoute = 'router.resource \'' +  names.filename.plural + '\'';
        }
      } else if (routerPath.match('.js')) {
        if (options.bare) {
          newRoute = 'router.match(\'/' +  names.filename.plural +
            '\').to({controller: \'' + names.constructor.plural +
            '\', action: \'index\'});';
        } else {
          newRoute = 'router.resource(\'' +  names.filename.plural + '\');';
        }
      }

      if (addRoute(routerPath, newRoute)) {
        console.log('[Added] ' + routeType + ' ' + names.filename.plural +
          ' route added to ' + routerPath);
      }
      else {
        console.log(routeType + ' ' + names.filename.plural + ' route already defined in ' +
          routerPath);
      }
    }
    else {
      console.log('There is no router file to add routes too');
    }

  });

  task('views', function (name, options) {
    if (!name) {
      throw new Error('No view name specified.');
    }

    options = options || {};

    // Option defaults
    options.engine = options.engine || 'ejs';

    var names = utils.string.getInflections(name)
      , engine = options.engine
      , appViewDir = path.join('app', 'views', names.filename.plural)
      , templateViewDir = path.join(genDirname, 'views', engine)
      , cmds = []
      , ext = '.html'
      , appLayoutPath
      , actions
      , addActionView;

    // Set extension based on engine option
    switch (engine) {
      case 'ejs':
        ext += '.ejs';
        break;
      case 'jade':
        ext += '.jade';
        break;
      case 'handlebars':
        ext += '.hbs';
        break;
      case 'mustache':
        ext += '.ms';
        break;
      case 'swig':
        ext += '.swig';
        break;
    }

    // Set application layout path
    appLayoutPath = path.join('app', 'views', 'layouts', 'application');
    // Copy template view to application path
    addActionView = function (action) {
      jake.cpR(path.join(templateViewDir, action + ext + '.ejs'), appViewDir, {silent: true});
    };

    jake.mkdirP(appViewDir);
    jake.mkdirP('app/views/layouts');
    addActionView('index');

    // Add views for the other CRUD actions when doing a full-on resource
    if (!options.bare) {
      ['add', 'edit', 'show'].forEach(function (action) {
        addActionView(action);
      });
    }

    // Create default layout if one doesn't exist
    // Hack: There should be a better way to detect if a application layout exists
    if (!utils.file.existsSync(appLayoutPath + '.html.ejs') && !utils.file.existsSync(appLayoutPath + '.html.jade') &&
       !utils.file.existsSync(appLayoutPath + '.html.hbs') && !utils.file.existsSync(appLayoutPath + '.html.ms') &&
       !utils.file.existsSync(appLayoutPath + '.html.swig')) {
      // Copy template layout file to apps application layout file
      jake.cpR(path.join(templateViewDir, 'layout' + ext + '.ejs'), appLayoutPath + ext, {silent: true});
    }

    // Add engine to package.json if it's not EJS
    if (engine !== 'ejs') {
      // Change to handlebars as we use it behind the scenes
      if (engine === 'mustache') {
        engine = 'handlebars';
      }
      var data = {dependencies: {}};
      data.dependencies[engine] = "*";

      mixinJSONData('package.json', data);
    }

    console.log('[Added] View templates');
  });

  task('viewsScaffold', function (name, options) {
    if (!name) {
      throw new Error('No view name specified.');
    }

    options = options || {};

    // Option defaults
    options.engine = options.engine || 'ejs';

    var names = utils.string.getInflections(name)
      , engine = options.engine
      , appViewDir = path.join('app', 'views', names.filename.plural)
      , templateViewDir
      , cmds = []
      , ext = '.html'
      , appLayoutPath
      , layoutViewPath
      , actions
      , addActionView
      , viewPath
      , text
      , adapter
      , templContent;

    // Set extension based on engine option
    switch (engine) {
      case 'ejs':
        ext += '.ejs';
        break;
      case 'jade':
        ext += '.jade';
        break;
      case 'handlebars':
        ext += '.hbs';
        break;
      case 'mustache':
        ext += '.ms';
        break;
      case 'swig':
        ext += '.swig';
        break;
    }

    // Get view path
    templateViewDir = options.realtime ?
                      path.join(genDirname, 'scaffold', 'realtime', 'views', engine) :
                      path.join(genDirname, 'scaffold', 'views', engine);


    // Set application layout path
    appLayoutPath = path.join('app', 'views', 'layouts', 'application');

    // Function to compile the template
    addActionView = function (action) {
      viewPath = path.join(templateViewDir, action + ext + '.ejs');
      if (!utils.file.existsSync(viewPath)) {
        return;
      }
      text = fs.readFileSync(viewPath).toString();

      // Compile template text
      adapter = new Adapter({engine: 'ejs', template: text});
      templContent = adapter.render({names: names, properties: _formatModelProperties(options.properties)});

      // Write file
      fs.writeFileSync(path.join(appViewDir, action + ext),
        templContent.replace(/<@/g, '<%').replace(/@>/g, '%>'), 'utf8');
    };

    jake.mkdirP(appViewDir);
    jake.mkdirP('app/views/layouts');

    // Add views for the other CRUD actions when doing a full-on resource
    ['index', 'add', 'show', 'edit', 'form'].forEach(function (action) {
      addActionView(action);
    });

    // Create default layout if one doesn't exist
    // Hack: There should be a better way to detect if a application layout exists
    if (!utils.file.existsSync(appLayoutPath + '.html.ejs') && !utils.file.existsSync(appLayoutPath + '.html.jade') &&
       !utils.file.existsSync(appLayoutPath + '.html.hbs') && !utils.file.existsSync(appLayoutPath + '.html.ms') &&
       !utils.file.existsSync(appLayoutPath + '.html.swig')) {
      // Copy template layout file to apps application layout file
      jake.cpR(path.join(templateViewDir, 'layout' + ext + '.ejs'), appLayoutPath + ext, {silent: true});
    }

    // Add engine to package.json if it's not EJS
    if (engine !== 'ejs') {
      // Change to handlebars as we use it behind the scenes
      if (engine === 'mustache') {
        engine = 'handlebars';
      }
      var data = {dependencies: {}};
      data.dependencies[engine] = "*";

      mixinJSONData('package.json', data);
    }

    console.log('[Added] View templates');
  });

  // Generate a new application secret in environment.js
  task('secret', function () {
    var secretsFile = path.join(cwd, 'config', 'secrets.json')
      , secret = utils.string.uuid(128);

    mixinJSONData(secretsFile, {secret: secret});
    console.log('Added app-secret to config/secrets.json.\n' +
        'DO NOT add this file into your revision control.\n' +
        'DO make a backup of it, keep it someplace safe.');
  });

  // Delegate to stuff in jakelib/auth.jake
  namespace('auth', function () {
    task('update', function () {
      var t = jake.Task['auth:update'];
      t.on('complete', function () {
        complete();
      });
      t.invoke.apply(t, arguments);
    });
  });

  // Delegate to stuff in jakelib/migration.jake
  task('migration', {async: true}, function (name) {
    if (!name) {
      throw new Error('No migration name provided.');
    }
    var t = jake.Task['migration:create'];
    t.on('complete', function () {
      complete();
    });
    t.invoke.apply(t, arguments);
  });

  // Delegate to stuff in jakelib/migration.jake
  task('auth', {async: true}, function (name) {
    if (!name) {
      throw new Error('No migration name provided.');
    }
    var t = jake.Task['auth:init'];
    t.on('complete', function () {
      complete();
    });
    t.invoke.apply(t, arguments);
  });

});

