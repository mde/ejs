var sessions = require('../sessions');

module.exports = new (function () {
  this.init = function (app, callback) {
    if (app.config.sessions) {
      sessions.createStore(app.config, callback);
    }
    else {
      callback();
    }
  };

})();


