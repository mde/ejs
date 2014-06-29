
// HACK, stub out aliased function for geddy-jake env
geddy.addFormat = function () {};

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
    var opts = {
          initItems: [
            'model'
          , 'controller'
          , 'router'
          , 'i18n'
          , 'mailer'
          , 'localAppInit'
          ]
        };
    require('../../lib/init').init(geddy, opts, function () {
      complete();
    });
  });

  task('cleanup', {async: true}, function () {
    // Disconnect all the adapters
    var adapters = geddy.model.adapters
      , adapter
      , keys = Object.keys(adapters)
      , doIt = function () {
          var key;
          if ((key = keys.shift())) {
            adapter = adapters[key];
            // Try to disconnect nicely
            if (typeof adapter.disconnect == 'function') {
              // If there's a disconnect error, don't flip out about it
              if (!adapter.listeners('error').length) {
                adapter.on('error', function () {});
              }
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


