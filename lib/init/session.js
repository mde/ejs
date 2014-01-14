var sessions = require('../sessions');

module.exports = new (function () {
  this.init = function (app, callback) {
    sessionsConfig = app.config.sessions;
    if (sessionsConfig) {
      sessions.createStore(sessionsConfig.store, callback);
    }
    else {
      callback();
    }
  };

})();


