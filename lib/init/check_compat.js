var fs = require('fs');

module.exports = {
  // Do checks here to see if this app will work with the current version
  // Should only be supporting apps from the immediate previous version
  init: function (app, callback) {
    // Apps generated with v0.9 won't have custom errors
    // Need to upgrade app to include error fu
    if (!fs.existsSync('app/views/errors')) {
      throw new Error('This app is not compatible with Geddy v0.11.\n' +
          'Run `geddy gen upgradePrevious` and `geddy gen upgrade` to fix this problem.');
    }
    callback();
  }
};
