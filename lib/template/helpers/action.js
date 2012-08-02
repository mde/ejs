/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://http://apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var helpersBase = require('../helpers')
  , utils = require('../../utils')
  , items = {};

// Create a new helper based on a action and controller and add it a helpers list
exports.create = function(options) {
  if(!options) return;
  var opts = options || {};

  opts.controller = utils.string.decapitalize(opts.controller);

  var names = utils.string.inflection(opts.controller)
    , idActions = ['show', 'edit']
    , name, action;

  // Return if the action isn't one that should be added
  if(!utils.array.included(opts.action, ['index', 'add', 'show', 'edit'])) return;

  // Default action function
  action = helpersBase.urlFor.action(opts);

  // If action requires Id then change the default action
  if(utils.array.included(opts.action, idActions)) {
    action = function(id) {
      opts.id = id;
      return helpersBase.urlFor.action(opts);
    };
  }

  // Set the helper names for each action
  if(opts.action === 'index') name = names.property.plural + 'Path';
  if(opts.action === 'add') name = 'add' + names.constructor.singular + 'Path';
  if(opts.action === 'show') name = names.property.singular + 'Path';
  if(opts.action === 'edit') name = 'edit' + names.constructor.singular + 'Path';

  items[name] = {
    name: name,
    action: action
  }
};

// Add the created helpers to a helpers object and return it
exports.add = function(helpers) {
  var key, value;

  for(var i in items) {
    key = i;
    value = items[i];

    helpers[key] = value;
  }

  return helpers;
};
