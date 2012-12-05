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

var actionHelper = require('../../../lib/template/helpers/action')
  , assert = require('assert')
  , helpers = {}
  , routeData = []
  , tests;

// name: Used for looping to check created action helpers
// data: Dummy data similar to what's created by the router
// expected: The expected outcome of the action helper
//   (name and action fields are the same as normal helpers)
//   (Some actions are actual functions(the ones that require args) but below
//      we use a dummy argument(1) when calling it)
routeData = [
    {
        name: 'tasksPath'
      , data: {params: {controller: 'tasks', action: 'index'}, parts: ['/tasks', {path: '.:format'}]}
      , expected: {name: 'tasksPath', action: '/tasks'}
    }, {
        name: 'addTaskPath'
      , data: {params: {controller: 'tasks', action: 'add'}}
      , expected: {name: 'addTaskPath', action: '/tasks/add'}
    }, {
        name: 'taskPath'
      , data: {params: {controller: 'tasks', action: 'show'}, path: '/tasks/:id(.:format)'}
      , expected: {name: 'taskPath', action: '/tasks/1'}
    }, {
        name: 'editTaskPath'
      , data: {params: {controller: 'tasks', action: 'edit'}, path: '/tasks/:id/edit(.:format)'}
      , expected: {name: 'editTaskPath', action: '/tasks/1/edit'}
    }
];

tests = {

  'test get with no helpers': function () {
    var expected = {}
      , actual = actionHelper.get();
    assert.deepEqual(expected, actual);
  }

, 'test creating action helpers': function () {
    for (var i = 0, len = routeData.length; i < len; i++) {
      var actual = actionHelper.create(routeData[i].data);

      // If action is a function(an action that takes an ID), execute the function
      if (typeof actual.action === 'function') {
        actual.action = actual.action('1')
      }

      assert.deepEqual(routeData[i].expected, actual);
    }
  }

, 'test getting with action helpers': function () {
    var actionHelpers = actionHelper.get()
      , expected
      , actual;

    // Check the retrieved helpers
    for (action in actionHelpers) {
      actual = actionHelpers[action]

      // Find the action helper from the sample data
      for (var i = 0, len = routeData.length; i < len; i++) {
        if (routeData[i].name == action) {
          expected = routeData[i].expected;
        }
      }

      assert.deepEqual(expected, actual);
    }
  }

, 'test adding the action helpers to a object': function () {
    var expected
      , actual;
    actionHelper.add(helpers)

    // Check each of the added helpers
    for (action in helpers) {
      actual = helpers[action]

      // Find the action helper from the sample data
      for (var i = 0, len = routeData.length; i < len; i++) {
        if (routeData[i].name == action) {
          expected = routeData[i].expected;
        }
      }

      assert.deepEqual(expected, actual);
    }
  }
};

module.exports = tests;
