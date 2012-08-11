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
var object = require('../../lib/utils/object').object
  , array = require('../../lib/utils/array').array
  , assert = require('assert')
  , tests = {}
  , checkObjects;

// Check if two objects are similar
checkObjects = function(first, second) {
  var finished = [];

  for(var i in first) {
    if((typeof first[i] === 'object') && (typeof second[i] === 'object')) {
      finished.push(checkObjects(first[i], second[i]));
    } else {
      if(first[i] === second[i]) {
        return true;
      } else {
        return false;
      }
    }
  }

  if(array.included(false, finished)) {
    return false;
  }
  return true;
};

tests = {

  'test merge in object': function() {
    var data = object.merge({user: 'geddy'}, {key: 'key'})
      , actual = {user: 'geddy', key: 'key'};
    assert.equal(checkObjects(data, actual), true);
  }

, 'test merge with overwriting keys in object': function() {
    var data = object.merge({user: 'geddy', key: 'geddyKey'}, {key: 'key'})
      , actual = {user: 'geddy', key: 'key'};
    assert.equal(checkObjects(data, actual), true);
  }

, 'test reverseMerge in object': function() {
    var data = object.reverseMerge({user: 'geddy'}, {key: 'key'})
      , actual = {user: 'geddy', key: 'key'};
    assert.equal(checkObjects(data, actual), true);
  }

, 'test reverseMerge with keys overwriting default in object': function() {
    var data = object.reverseMerge({user: 'geddy', key: 'geddyKey'}, {key: 'key'})
      , actual = {user: 'geddy', key: 'geddyKey'};
    assert.equal(checkObjects(data, actual), true);
  }

, 'test isEmpty with non empty object in object': function() {
    var data = object.isEmpty({user: 'geddy'})
      , actual = false;
    assert.equal(data, actual);
  }

, 'test isEmpty with empty object in object': function() {
    var data = object.isEmpty({})
      , actual = true;
    assert.equal(data, actual);
  }

};

module.exports = tests;
