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
var Adapter = require('./adapters').Adapter
  , Templater
  , Partial = require('./partial').Partial
  , Layout = require('./layout').Layout;

Templater = function () {};

Templater.prototype = new (function () {
  this.render = function (data, config, cb) {
    // Register data to helpers, and register the helpers to the adapter
    geddy.viewHelpers.registerData(data);
    Adapter.registerHelpers(geddy.viewHelpers);

    var layout = new Layout(config.layout, config.template, data);
    layout.render(cb);
  };
})();
exports.Templater = Templater;

