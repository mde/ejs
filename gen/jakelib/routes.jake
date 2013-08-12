var helpers = require('./helpers')
  , mixinJSONData = helpers.mixinJSONData
  , getRouterPath = helpers.getRouterPath
  , getRoutes = helpers.getRoutes
  , addRoute = helpers.addRoute;


task('routes', ['env:init'], {async: true}, function (resource) {
  if (resource) {
    console.log('Showing route results for "' + resource + '"');
  }
  else {
    console.log('Showing all routes');
  }
  console.log(getRoutes(resource));
  complete();
});




