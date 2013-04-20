var fs = require('fs')
  , path = require('path')
  , utils = require('utilities')
  , cwd = process.cwd();

exports.mixinJSONData = function (file, obj) {
  var data = obj || {};

  if (utils.file.existsSync(file)) {
    try {
      var content = JSON.parse(fs.readFileSync(file, 'utf8'));
      utils.object.merge(content, data);
      fs.writeFileSync(file, JSON.stringify(content, null, 2));
    }
    catch (e) {
      throw new Error("Could not parse " + file);
    }
  }
  else {
    console.log("There is no file " + file + " to add data to.");
  }
};

exports.getRouterPath = function () {
  var beginPath
    , jsRouter = path.normalize('config/router.js')
    , coffeeRouter = path.normalize('config/router.coffee')
    , routerPath;
  // Check if the router file exists
  beginPath = path.join(cwd, 'config');
  utils.file.searchParentPath(jsRouter, function (err) {
    if (err) {
      var jsErr = err;
      // If jsEnvironment wasn't found, try finding coffee variant
      utils.file.searchParentPath(coffeeRouter, beginPath, function (err) {
        if (err) {
          throw jsErr;
        } else {
          routerPath = coffeeRouter;
        }
      });
    } else {
      routerPath = jsRouter;
    }
  });
  return routerPath;
};

exports.getRoutes = function (resource) {
  if (!resource) {
    return geddy.router.toString();
  }

  var rts = []
    , _rt
    , i;

  // If a full route name was given add it to the list(e,g,. users.index)
  if (resource.match(/.+\..+/)) {
    var res = resource.split('.')
      , cont = res[0]
      , action = res[1];

    for (i in geddy.router.routes) {
      _rt = geddy.router.routes[i];

        if (_rt.params.controller.match(cont) &&
          _rt.params.action.match(action)) {
        rts.push(_rt);
      }
    }
  }
  else {
    for (i in geddy.router.routes) {
      _rt = geddy.router.routes[i];

      if (_rt.params.controller.match(resource) ||
          _rt.params.action.match(resource)) {
        rts.push(_rt);
      }
    }
  }

  return rts.map(function (rt) {
    return rt.toString();
  }).join('\n');
};

exports.addRoute = function (routerPath, newRoute) {
  var text = fs.readFileSync(routerPath, 'utf8')
    , routerArr;
  // Don't add the same route over and over
  if (text.indexOf(newRoute) == -1) {
    // Add the new resource route just above the export
    routerArr = text.split('exports.router');
    routerArr[0] += newRoute + '\n';

    text = routerArr.join('exports.router');
    fs.writeFileSync(routerPath, text, 'utf8');
    return true;
  }
  else {
    return false;
  }
};


