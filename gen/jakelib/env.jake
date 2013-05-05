
namespace('env', function () {
  task('init', {async: true}, function () {
    var cfg = {};
    if (process.env.environment) {
      cfg.environment = process.env.environment;
    }

    jake.addListener('complete', function (e) {
      jake.Task['env:cleanup'].invoke();
    });

    geddy.config = require('../../lib/config').readConfig(cfg);
    geddy.model = require('model');
    geddy.controller = require('../../lib/controller');

    require('../../lib/init').init(geddy, function () {
      complete();
    });
  });

  task('cleanup', function () {
    // Disconnect all the adapters
    var adapters = geddy.model.loadedAdapters
      , adapter;

    for (var p in adapters) {
      adapter = adapters[p];
      if (typeof adapter.disconnect == 'function') {
        adapter.disconnect();
      }
    }
  });

});


