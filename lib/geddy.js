
var geddy = global.geddy || {}
  , cluster = require('cluster')
  , master
  , worker
  , utils = require('utilities')
  , pkg = require('../package')
  , App;

geddy.isMaster = cluster.isMaster;

utils.mixin(geddy, {version: pkg.version});
utils.mixin(geddy, utils);
utils.mixin(geddy, new (function () {
  var _started = false
    , _opts = {};

  this.config = function (o) {
    _opts = o;
  };

  this.start = function () {
    var m
      , w
      , app;

    // No repeatsies
    if (_started) {
      return;
    }

    // Master-process, start workers
    if (geddy.isMaster) {
      master = require('../lib/cluster/master');
      m = new master.Master();
      m.start(_opts);
    }
    // Worker-process, start up an app
    else {
      App = require('./app.js').App;

      worker = require('../lib/cluster/worker');
      w = new worker.Worker();
      geddy.worker = w;

      w.init(function () {
        utils.mixin(geddy, w);

        app = new App();
        app.init(function () {
          w.startServer();
          utils.mixin(geddy, app);
        });
      });
    }
  };

})());

// Set the One True Geddy Global
global.geddy = geddy;

// Also allow export/local
module.exports = geddy;

