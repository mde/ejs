
var geddy = global.geddy || {}
  , utils = require('utilities')
  , pkg = require('../package');

// Set the One True Geddy Global
global.geddy = geddy;

utils.mixin(geddy, {version: pkg.version});

utils.mixin(geddy, utils);

utils.mixin(geddy, new (function () {
  var _started = false;

  this.start = function (options) {
    var opts = options || {}
      , App
      , app
      , config = require('./config')
      , c = config.readConfig(opts);

    geddy.config = c;

    App = require('./app').App;

    worker = require('../lib/cluster/worker');
    w = new worker.Worker();
    geddy.worker = w;

    w.init({clustered: false, logger: c.logger || utils.log}, function () {
      utils.mixin(geddy, w);

      app = new App();
      app.init(function () {
        w.startServer();
        utils.mixin(geddy, app);
      });
    });
    w.configure(c);
  };

  this.startCluster = function (options) {
    var opts = options || {}
      , cluster = require('cluster')
      , master
      , worker
      , m
      , w
      , App
      , app;

    // No repeatsies
    if (_started) {
      return;
    }

    geddy.isMaster = cluster.isMaster;

    // Master-process, start workers
    if (geddy.isMaster) {
      master = require('../lib/cluster/master');
      m = new master.Master();
      m.start(opts);
    }
    // Worker-process, start up an app
    else {
      App = require('./app').App;

      worker = require('../lib/cluster/worker');
      w = new worker.Worker();
      geddy.worker = w;

      w.init({clustered: true}, function () {
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

// Also allow export/local
module.exports = geddy;

