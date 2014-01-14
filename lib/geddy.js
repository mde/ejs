
var geddy = global.geddy || {}
  , EventEmitter = require('events').EventEmitter
  , utils = require('utilities')
  , pkg = require('../package');

// Set the One True Geddy Global
global.geddy = geddy;

utils.enhance(geddy, new EventEmitter());

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
      app.init(w.config, function () {
        geddy.emit('initialized');
        utils.mixin(geddy, app);
        w.startServer(function () {
          geddy.emit('started');
        });
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
        app.init(w.config, function () {
          geddy.emit('initialized');
          utils.mixin(geddy, app);
          w.startServer(function () {
            geddy.emit('started');
          });
        });
      });
    }
  };

})());

// Also allow export/local
module.exports = geddy;

