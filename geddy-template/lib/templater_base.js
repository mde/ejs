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

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * A TemplaterBase is an instance of EventEmitter that emits a 'data'
 * and an 'end' event
 * @contstructor
 */
var TemplaterBase = function () {};

TemplaterBase.prototype = new EventEmitter();

TemplaterBase.prototype.eventTypes = {
  DATA: 'data'
  , END: 'end'
};

/**
 * The render method renders the data into a template string,
 * emiting a 'data' event whenever there's data to write to the
 * response
 *
 * @param {Object} data The object to use for the source of data
 * in the rendered template
 * @param {Array} [paths] An optional list of paths to use to look
 * for template-partials. By default, this will contain a single item,
 * the templateRoot of the calling controller.
 * @param {String} [paths] An optional filename to get the initial 
 * template partial. By default, this will contain the name of the
 * action called on the controller.
 */
TemplaterBase.prototype.render = function (data, paths, filename) {
  
  // Do some stuff with the passed-in data
  var content = util.inspect(data);

  // Emit 'data' events whenever there's content to push out to
  // the response
  this.emit(this.eventTypes.DATA, content);
  
  // Emit 'end' when all finished
  this.emit(this.eventTypes.END);
};

exports.TemplaterBase = TemplaterBase;
