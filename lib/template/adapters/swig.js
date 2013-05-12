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

var file = require('utilities').file
  , swig = {};

swig = function () {
  this.engine = this.engine || file.requireLocal('swig');

  this.engine.init({
    allowErrors: false,
    autoescape: true,
    cache: false,
    encoding: 'utf8',
    filters: {},
    root: '/',
    tags: {},
    extensions: {},
    tzOffset: 0
  });
};

swig.prototype.compile = function (template, options) {
  // If there is no baseNamePath swig will use the template string as a key.  Use a hash as a key instead
  if(!options.baseNamePath){
    options.baseNamePath = require('crypto').createHash('sha1').update(template).digest('hex');
  }
  return this.engine.compile(template, {filename: options.baseNamePath});
};

swig.prototype.render = function (data, fn) {
  return fn(data);
};

module.exports = swig;
