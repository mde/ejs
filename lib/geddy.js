/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var geddy = global.geddy || {}
  , cluster = require('cluster')
  , utils = require('./utils')
  , pkg = require('../package')
  , master
  , worker
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

// Set geddy as global and as an export/local
global.geddy = module.exports = geddy;