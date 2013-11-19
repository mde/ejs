
namespace('env', function () {
  task('init', ['model', 'controller', 'app'], function () {
    jake.addListener('complete', function (e) {
      jake.Task['env:cleanup'].invoke();
    });
  });

  task('config', function () {
    var cfg = {};
    if (process.env.environment) {
      cfg.environment = process.env.environment;
    }
    geddy.config = require('../../lib/config').readConfig(cfg);
  });

  task('model', ['config'], function () {
    geddy.model = require('model');
  });

  task('controller', ['config'], function () {
    geddy.controller = require('../../lib/controller');
  });

  task('app', ['config'], {async: true}, function () {
    require('../../lib/init').init(geddy, function () {
      complete();
    });
  });

  task('cleanup', {async: true}, function () {
    // Disconnect all the adapters
    var adapters = geddy.model.loadedAdapters
      , adapter
      , keys = Object.keys(adapters)
      , doIt = function () {
          var key;
          if ((key = keys.shift())) {
            adapter = adapters[key];
            // Try to disconnect nicely
            if (typeof adapter.disconnect == 'function') {
              // If there's a disconnect error, don't flip out about it
              adapter.on('error', function () {});
              adapter.disconnect(function () {
                doIt();
              });
            }
          }
          else {
            complete();
          }
        };
    doIt();
  });

});


