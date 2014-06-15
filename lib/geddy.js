
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
  var _started = false
    , _master
    , _worker

  this.start = function (options) {
    var opts = options || {}
      , App
      , app
      , worker
      , config = require('./config')
      , c = config.readConfig(opts);

    geddy.config = c;

    App = require('./app').App;

    worker = require('../lib/cluster/worker');
    _worker = new worker.Worker();
    geddy.worker = _worker;

    _worker.init({clustered: false, logger: c.logger || utils.log}, function () {
      utils.mixin(geddy, _worker);

      app = new App();
      app.init(_worker.config, function () {
        geddy.emit('initialized');
        utils.mixin(geddy, app);
        _worker.startServer(function () {
          geddy.emit('started');
        });
      });
    });
    _worker.configure(c);
  };

  this.startCluster = function (options) {
    var opts = options || {}
      , cluster = require('cluster')
      , master
      , worker
      , App
      , app;

    // No repeatsies
    if (_started) {
      return;
    }

    geddy.isMaster = cluster.isMaster;
    geddy.isWorker = cluster.isWorker;

    // Master-process, start workers
    if (geddy.isMaster) {
      master = require('../lib/cluster/master');
      _master = new master.Master();
      _master.on('started', function () {
        geddy.emit('clusterStarted');
      });
      _master.start(opts);
    }
    // Worker-process, start up an app
    else {
      App = require('./app').App;

      worker = require('../lib/cluster/worker');
      _worker = new worker.Worker();
      geddy.worker = _worker;

      _worker.init({clustered: true}, function () {
        utils.mixin(geddy, _worker);

        app = new App();
        app.init(_worker.config, function () {
          geddy.emit('initialized');
          utils.mixin(geddy, app);
          _worker.startServer(function () {
            geddy.emit('started');
          });
        });
      });
    }
  };

  this.stop = function () {
    if (geddy.isMaster || geddy.isWorker) {
      throw new Error('`stop` should only be called in an unclustered server.');
    }
    _worker.shutdown();
  };

  this.stopCluster = function () {
    if (!geddy.isMaster) {
      throw new Error('`stopCluster` should only be called in the master process of a cluster.');
    }
    _master.startShutdown();
  };

})());

// Also allow export/local
module.exports = geddy;

