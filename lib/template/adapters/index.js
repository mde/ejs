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

var Adapter = function(data) {
  var engine;

  this.data = data.data;

  // Load rendering engine
  if(data.data.ext.match(/\.ejs$/)) engine = require('./ejs').Template;
  if(data.data.ext.match(/\.jade$/)) engine = require('./jade').Template;
  if(data.data.ext.match(/\.hbs$/)) engine = require('./handlebars').Template;
  if(data.data.ext.match(/\.(mustache|ms|mu)$/)) engine = require('./mustache').Template;

  // Create new instance of the rendering engine and return it
  this.engine = new engine(data);
  return this.engine;
};

Adapter.prototype = new function() {

  this.process = function(data) {
    return this.engine.process(data);
  };

};

exports.Adapter = Adapter;
