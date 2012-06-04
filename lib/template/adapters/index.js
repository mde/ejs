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

var adapter = {};

// Holder for pluggable engines and a place for holding the current
// templates data for easily requiring specific engines
adapter.engine = undefined;
adapter.data = undefined;

adapter.Template = function(data) {
  adapter.data = data.data;

  if(data.data.ext.match(/\.ejs$/)) {
    // Load EJS engine
    var Ejs = require('./ejs').Template;
    adapter.engine = new Ejs(data);
  }

  return adapter.engine;
};

adapter.Template.prototype = new function() {

  this.process = function(data) {
    return adapter.engine.process(data);
  };

};

exports.Template = adapter.Template;
