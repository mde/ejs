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

// Create a new helper from the given route object
exports.create = function (data) {
  if (!data || !data.params) {
    return;
  }

  // If action is one that shouldn't have a helper skip it
  if (utils.array.included(data.params.action, ['create', 'update', 'destroy'])) {
    return;
  }

  var controllerName = data.params.controller
    , controllerNames = utils.string.getInflections(controllerName)
    , name = ''
    , helper = {name: '', action: ''};

  // Set the helper names for each action
  switch (data.params.action) {
    case 'index':
      // neilPeartsPath
      name = controllerNames.property.plural + 'Path';
      break;
    case 'add':
      // addNeilPeartPath
      name = 'add' + controllerNames.constructor.singular + 'Path';
      break;
    case 'show':
      // neilPeartPath
      name = controllerNames.property.singular + 'Path';
      break;
    case 'edit':
      // editNeilPeartPath
      name = 'edit' + controllerNames.constructor.singular + 'Path';
      break;
    default:
      // Unknown action name, so just add Path to it
      name = data.params.action + 'Path';
      break;
  }
  helper.name = name;

  // Attempt to use the easy way to build the helper
  if (data.parts) {
    var args = []
      , funcBody = 'return ""'
      , func
      , val;

    for (var i in data.parts) {
      val = data.parts[i];

      if (typeof val === 'string') {
        funcBody += ' + "'+ val + '"';
      }
      else if (typeof val === 'object') {
        // Skip the item if it's just a format
        if (val.path === '.:format') {
          continue;
        }

        if (val.name) {
          args.push(val.name);
          funcBody += ' + ' + val.name;
        }
      }
    }

    func = new Function(args, funcBody);
    if (args.length > 0) {
      helper.action = func;
    }
    else {
      helper.action = func();
    }
  }
  // Fallback to using the path if it's given
  else if (data.path) {
    var path = data.path.replace('(.:format)', '')
      , pathItems = (path.split(/\//g)).slice(1)
      , args = []
      , funcBody = 'return ""'
      , func
      , val;

    for (var i in pathItems) {
      val = pathItems[i];

      // If the first char is : then it's a param
      if (val[0] === ':') {
        val = val.slice(1);

        args.push(val);
        funcBody += ' + "/" + ' + val;
      }
      else {
        funcBody += ' + "/' + val + '"';
      }
    }

    func = new Function(args, funcBody);
    if (args.length > 0) {
      helper.action = func;
    }
    else {
      helper.action = func();
    }
  }
  // Finally just use the controller and action params
  else {
    // Default action function
    helper.action = helpersBase.urlFor.action(data.params);

    // If action requires ID then change the default action
    if (utils.array.included(data.params.action, ['show', 'edit'])) {
      helper.action = function (id) {
        data.params.id = id;
        return helpersBase.urlFor.action(data.params);
      };
    }
  }

  items[name] = helper;
  return helper;
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
