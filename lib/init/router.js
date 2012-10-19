var path = require('path')
  , FunctionRouter = require('../routers/function_router').FunctionRouter
  , RegExpRouter = require('barista').Router;

geddy.FunctionRouter = FunctionRouter;
geddy.RegExpRouter = RegExpRouter;

module.exports = new (function () {

  this.init = function (app, callback) {
    var cwd = process.cwd()
      , routerCsFile = path.join(cwd, '/config/router.coffee')
      , router;

    if (geddy.file.existsSync(routerCsFile)) {
      geddy.file.requireLocal('coffee-script');
    }
    router = require(path.join(cwd, '/config/router'));
    router = router.router || router;
    app.router = router;

    callback();
  };

})();


