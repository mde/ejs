var helpers = require('./helpers')
  , mixinJSONData = helpers.mixinJSONData
  , getRouterPath = helpers.getRouterPath
  , getRoutes = helpers.getRoutes
  , addRoute = helpers.addRoute;


task('routes', ['env:init'], {async: true}, function (resource) {
  console.log('Showing route results for "' + resource + '"');
  console.log(getRoutes(resource));
  complete();
});




