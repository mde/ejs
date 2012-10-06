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
  , utils = require('utilities')
  , items = {};

// Create a new helper based on a action and controller and add it a helpers list
exports.create = function (options) {
  if (!options) {
    return;
  }

  // Controller name is plural, initial-cap, camel-case (e.g. NealPearts)
  var controllerName = options.controller
    , names = utils.string.getInflections(controllerName)
    , idActions = ['show', 'edit']
    , name, action;

  // Return if the action isn't one that should be added
  if (!utils.array.included(options.action, ['index', 'add', 'show', 'edit'])) {
    return;
  }

  // Default action function
  action = helpersBase.urlFor.action(options);

  // If action requires Id then change the default action
  if (utils.array.included(options.action, idActions)) {
    action = function (id) {
      options.id = id;
      return helpersBase.urlFor.action(options);
    };
  }

  // Set the helper names for each action
  switch (options.action) {
    case 'index':
      // neilPeartsPath
      name = names.property.plural + 'Path';
      break;
    case 'add':
      // addNeilPeartPath
      name = 'add' + names.constructor.singular + 'Path';
      break;
    case 'show':
      // neilPeartPath
      name = names.property.singular + 'Path';
      break;
    case 'edit':
      // editNeilPeartPath
      name = 'edit' + names.constructor.singular + 'Path';
      break;
    default:
      // No default
  }

  items[name] = {
    name: name,
    action: action
  };
  return items[name];
};


// Retrieve the list of current action helpers
exports.get = function () {
  return items;
}

// Add the created helpers to a helpers object and return it
exports.add = function (helpers) {
  var key, value;

  for (var i in items) {
    key = i;
    value = items[i];

    helpers[key] = value;
  }

  return helpers;
};
