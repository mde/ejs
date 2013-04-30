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

Templater = function (layout, template, data) {
  this.layout = layout;
  this.template = template;
  this.data = data;
};

Templater.prototype = new (function () {
  this.render = function (cb) {
    // Register data to helpers, and register the helpers to the adapter
    geddy.viewHelpers.registerData(this.data);
    Adapter.registerHelpers(geddy.viewHelpers);

    var layout = new Layout(this.layout, this.template, this.data);
    layout.render(cb);
  };
})();
exports.Templater = Templater;

