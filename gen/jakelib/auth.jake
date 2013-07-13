var path = require('path')
  , cwd = process.cwd()
  , geddyPassport = 'geddy-passport@0.0.x'
  , helpers = require('./helpers')
  , mixinJSONData = helpers.mixinJSONData
  , getRouterPath = helpers.getRouterPath
  , getRoutes = helpers.getRoutes
  , addRoute = helpers.addRoute;

namespace('auth', function () {

  task('update', {async: true}, function () {
    var updatePath = path.join('geddy-passport', 'app', 'helpers', 'passport')
      , from
      , to;

    console.log('Updating passport helpers from', geddyPassport);
    jake.exec('npm uninstall ' + geddyPassport +
      ' && npm install ' + geddyPassport, function () {
      from = path.join(cwd, 'node_modules', updatePath);
      to = path.join(cwd, 'app', 'helpers');

      jake.rmRf(path.join(cwd, 'passport'), {silent: true});
      jake.cpR(from, to, {silent: true});

      console.log("\nCleaning up...");
      jake.exec('npm uninstall ' + geddyPassport, function () {
        complete();
      });
    }, {printStdout: true});
  });

  task('init', {async: true}, function (engine) {
    var env = process.env
      , readline = require('readline')
      , fromBase = env.srcDir ||
            path.join(cwd, 'node_modules', 'geddy-passport')
      , install = false
      , rl, installPackages, passportCopy;

    if (!engine || engine == 'default') {
      engine = 'ejs';
    }

    // Create and start the prompt
    rl = readline.createInterface({
        input: process.stdin
      , output: process.stdout
    });
    rl.setPrompt("WARNING: This command will create/overwrite files in your app.\n" +
      "Do you wish to continue?(yes|no)\n\n");
    rl.prompt();

    rl.on('line', function (line) {
      if (line === 'yes' || line === 'y') {
        install = true;
      }

      rl.close();
    });

    rl.on('close', function () {
      if (!install) {
        return;
      }

      if (env.srcDir) {
        console.log('Installing from ' + fromBase);
        installPackages();
      }
      else {
        console.log('Installing', geddyPassport);
        jake.exec('npm uninstall ' + geddyPassport +
          ' && npm install ' + geddyPassport, installPackages, {printStdout: true});
      }
    });

    // Gets the package versions from geddy-passport's package.json
    // and installs them, then calls passportCopy
    installPackages = function () {
      var deps = require(path.join(fromBase, 'package')).dependencies
        , packages = ''
        , k;

      mixinJSONData(path.join(cwd, 'package.json'), {dependencies: deps});

      for (k in deps) {
        packages += k + '@' + deps[k] + ' ';
      }

      console.log("\nInstalling", packages);
      jake.exec('npm uninstall ' + packages +
        ' && npm install ' + packages, passportCopy, {printStdout: true});
    };

    // Copy the contents of geddy-passport into the application
    passportCopy = function () {
      var list = require(path.join(fromBase, 'file_list'))
        , routerPath = getRouterPath()
        , newRoute
        , from
        , to
        , p
        , i
        , engineExt = {
            ejs: '.ejs'
          , jade: '.jade'
          , handlebars: '.hbs'
          , mustache: '.ms'
          , swig: '.swig'
          };

      // Copy files to the application
      for (i = 0; i < list.length; i++) {
        item = list[i];
        from = path.join(fromBase, item);
        to = path.dirname(path.join(cwd, item));

        if (item.match('app/views')) {
          from = from.replace('app/views', 'app/views_' + engine);
          from = from.replace(/\[\.ext\]$/, engineExt[engine]);
          to = to.replace(/\[\.ext\]$/, engineExt[engine]);
        }

        jake.mkdirP(to);
        console.log('Creating file:', path.join(to, path.basename(from)));

        // Delete any existing interferring templates
        if (item.match('app/views')) {
          ['.jade', '.ejs', '.ms', '.mustache', '.hbs', '.handlebars', '.swig'].forEach(function (ext) {
            p = path.basename(item, path.extname(item)) + ext;

            jake.rmRf(path.join(to, p), {silent: true});
          });
        }

        jake.cpR(from, to, {silent: true});
      }

      // Add new routes to router
      if (routerPath) {
        // CoffeeScript routes
        if (routerPath.match('.coffee')) {
          newRoute = "router.get('/login').to 'Main.login'\n" +
            "router.get('/logout').to 'Main.logout'\n" +
            "router.post('/auth/local').to 'Auth.local'\n" +
            "router.get('/auth/twitter').to 'Auth.twitter'\n" +
            "router.get('/auth/twitter/callback').to 'Auth.twitterCallback'\n" +
            "router.get('/auth/facebook').to 'Auth.facebook'\n" +
            "router.get('/auth/facebook/callback').to 'Auth.facebookCallback'\n" +
            "router.get('/auth/yammer').to 'Auth.yammer'\n" +
            "router.get('/auth/yammer/callback').to 'Auth.yammerCallback'\n" +
            "router.resource 'users'";
        } else {
          newRoute = "router.get('/login').to('Main.login');\n" +
            "router.get('/logout').to('Main.logout');\n" +
            "router.post('/auth/local').to('Auth.local');\n" +
            "router.get('/auth/twitter').to('Auth.twitter');\n" +
            "router.get('/auth/twitter/callback').to('Auth.twitterCallback');\n" +
            "router.get('/auth/facebook').to('Auth.facebook');\n" +
            "router.get('/auth/facebook/callback').to('Auth.facebookCallback');\n" +
            "router.get('/auth/yammer').to('Auth.yammer');\n" +
            "router.get('/auth/yammer/callback').to('Auth.yammerCallback');\n" +
            "router.resource('users');";
        }

        if (addRoute(routerPath, "\n" + newRoute)) {
          console.log('\nAdded authentication routes:\n' + newRoute);
        } else {
          console.log('\nAuthentication routes already defined in', routerPath);
        }
      }
      else {
        console.log('\nThere is no router file to add routes too.');
      }

      // Create secrets and copy the secrets template
      console.log("\nCreating secrets.json file with stubbed-out Passport config.");
      jake.cpR(path.join(fromBase, 'config', 'secrets.json.template'),
        path.join(cwd, 'config', 'secrets.json'), {silent: true});
      jake.Task['gen:secret'].invoke();

      // Remove geddy-passport as it isn't needed anymore
      console.log('\nCleaning up...');
      jake.exec('npm uninstall geddy-passport', function () {
        console.log('Please set up your Passport config in config/secrets.json');
        complete();
      });
    };
  });

});

