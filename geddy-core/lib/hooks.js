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

var util = require('util');

var hooks = new function () {
  this.collection = {};
  
  this.registerHook = function (name, hook) {
    this.collection[name] = new hooks.Hook(name, hook);
  };

}();

hooks.Hook = function (name, params) {
  this.name = name;
  this.func = params.func;
  this.callback = params.callback;
}

module.exports = hooks;

