var inFlight = require('../in_flight');

module.exports = {
  init: function (app, callback) {
    var t = app.config.requestTimeout;
    if (t && t > 0) {
      inFlight.setTimeout(t);
    }
    callback();
  }
};
