var fs = require('fs')
  , path = require('path')
  , utils = require('utilities')
  , helpers = require('../template/helpers')
  , actionHelpers = require('../template/helpers/action')
  , usingCoffee;

module.exports = new (function () {
  var PAT = /\.(js|coffee)$/;

  this.init = function (app, callback) {
    var helper
      , helperDir = path.join(process.cwd(), 'app/helpers')
      , dirList
      , helperPath
      , appHelpers
      , router = app.router;

    app.viewHelpers = {};

    // Create action helpers based on router
    var i = router.routes.length;
    while (--i >= 0) {
      actionHelpers.create(router.routes[i]);
    }
    actionHelpers.add(helpers); // Add action helpers to helpers

    // Make all helpers available in the view
    for (var p in helpers) {
      helper = helpers[p];
      // Assign to app.helpers
      app.viewHelpers[p] = helper.action;
    }

    // Load local app-helpers, make them available to the view
    if (utils.file.existsSync(helperDir)) {
      dirList = fs.readdirSync(helperDir);

      for (var i = 0, ii = dirList.length; i < ii; i++) {
        helperPath = path.join(helperDir, dirList[i]);

        if (PAT.test(helperPath)) {
          if (helperPath.match('.coffee')) {
            usingCoffee = usingCoffee || utils.file.requireLocal('coffee-script')
          }
          appHelpers = require(helperPath);

          for (var p in appHelpers) {
            app.viewHelpers[p] = appHelpers[p];
          }
        }
      }
    }

    callback();
  };

})();
