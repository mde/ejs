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
  options = options || {};

  options.controller = utils.string.decapitalize(options.controller);

  var names = utils.string.inflection(options.controller)
    , idActions = ['show', 'edit']
    , name, action;

  // Return if the action isn't one that should be added
  if(!utils.array.included(options.action, ['index', 'add', 'show', 'edit'])) return;

  // Default action function
  action = function() {
    return helpersBase.urlFor.action(options);
  };

  // If action requires Id then change the default action
  if(utils.array.included(options.action, idActions)) {
    action = function(id) {
      options.id = id;
      return helpersBase.urlFor.action(options);
    };
  }

  // Set the helper names for each action
  if(options.action === 'index') name = names.property.plural + 'Path';
  if(options.action === 'add') name = 'add' + names.constructor.singular + 'Path';
  if(options.action === 'show') name = names.property.singular + 'Path';
  if(options.action === 'edit') name = 'edit' + names.constructor.singular + 'Path';

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
