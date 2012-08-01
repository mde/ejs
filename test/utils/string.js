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
var string = require('../../lib/utils/string').string
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

  'test toArray for string': function() {
    var data = string.toArray('geddy')
      , actual = ['g', 'e', 'd', 'd', 'y'];

    // Loop through each item and check
    // if not, then the arrays aren't _really_ the same
    var i = actual.length;
    while(--i >= 0) {
      assert.equal(data[i], actual[i]);
    }
  }

, 'test reverse for string': function() {
    var data = string.reverse('yddeg')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic ltrim for string': function() {
    var data = string.ltrim('   geddy')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test custom char ltrim for string': function() {
    var data = string.ltrim('&&geddy', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic rtrim for string': function() {
    var data = string.rtrim('geddy  ')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test custom char rtrim for string': function() {
    var data = string.rtrim('geddy&&', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic trim for string': function() {
    var data = string.trim(' geddy  ')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test custom char trim for string': function() {
    var data = string.trim('&geddy&&', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic lpad for string': function() {
    var data = string.lpad('geddy', '&', 7)
      , actual = '&&geddy';
    assert.equal(data, actual);
  }

, 'test lpad without width for string': function() {
    var data = string.lpad('geddy', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test lpad without width of char for string': function() {
    var data = string.lpad('geddy')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic rpad for string': function() {
    var data = string.rpad('geddy', '&', 7)
      , actual = 'geddy&&';
    assert.equal(data, actual);
  }

, 'test rpad without width for string': function() {
    var data = string.rpad('geddy', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test rpad without width of char for string': function() {
    var data = string.rpad('geddy')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test basic pad for string': function() {
    var data = string.pad('geddy', '&', 7)
      , actual = '&geddy&';
    assert.equal(data, actual);
  }

, 'test pad without width for string': function() {
    var data = string.pad('geddy', '&')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test pad without width of char for string': function() {
    var data = string.pad('geddy')
      , actual = 'geddy';
    assert.equal(data, actual);
  }

  // We could test truncate and truncateHTML here, but helper tests already
  // include tests for them

, 'test nl2br for string': function() {
    var data = string.nl2br("geddy\n")
      , actual = 'geddy<br />';
    assert.equal(data, actual);
  }

, 'test snakeize for string': function() {
    var data = string.snakeize("geddyJs")
      , actual = 'geddy_js';
    assert.equal(data, actual);
  }

, 'test snakeize with beginning caps for string': function() {
    var data = string.snakeize("GeddyJs")
      , actual = 'geddy_js';
    assert.equal(data, actual);
  }

, 'test camelize for string': function() {
    var data = string.camelize("geddy_js")
      , actual = 'geddyJs';
    assert.equal(data, actual);
  }

, 'test camelize with initialCap for string': function() {
    var data = string.camelize("geddy_js", {initialCap: true})
      , actual = 'GeddyJs';
    assert.equal(data, actual);
  }

, 'test camelize with leadingUnderscore with no underscore for string': function() {
    var data = string.camelize("geddy_js", {leadingUnderscore: true})
      , actual = 'geddyJs';
    assert.equal(data, actual);
  }

, 'test camelize with leadingUnderscore with underscore for string': function() {
    var data = string.camelize("_geddy_js", {leadingUnderscore: true})
      , actual = '_geddyJs';
    assert.equal(data, actual);
  }

, 'test decapitalize for string': function() {
    var data = string.decapitalize("Geddy")
      , actual = 'geddy';
    assert.equal(data, actual);
  }

, 'test capitalize for string': function() {
    var data = string.capitalize("geddy")
      , actual = 'Geddy';
    assert.equal(data, actual);
  }

, 'test dasherize for string': function() {
    var data = string.dasherize("geddyJs")
      , actual = 'geddy-js';
    assert.equal(data, actual);
  }

, 'test dasherize with custom replace char for string': function() {
    var data = string.dasherize("geddyJs", "_")
      , actual = 'geddy_js';
    assert.equal(data, actual);
  }

, 'test underscorize for string': function() {
    var data = string.underscorize("geddyJs")
      , actual = 'geddy_js';
    assert.equal(data, actual);
  }

, 'test inflection for string': function() {
    var data = string.inflection("string")
      , actual = {
        filename: {
            singular: "string"
          , plural: "strings"
        },
        constructor: {
            singular: "String"
          , plural: "Strings"
        },
        property: {
            singular: "string"
          , plural: "strings"
        },
        url: {
            singular: "string"
          , plural: "strings"
        }
      };

    assert.equal(checkObjects(data, actual), true);
  }

, 'test inflection with odd name for string': function() {
    var data = string.inflection("snow_dog")
      , actual = {
        filename: {
            singular: "snow_dog"
          , plural: "snow_dogs"
        },
        constructor: {
            singular: "SnowDog"
          , plural: "SnowDogs"
        },
        property: {
            singular: "snowDog"
          , plural: "snowDogs"
        },
        url: {
            singular: "snow_dog"
          , plural: "snow_dogs"
        }
      };

    assert.equal(checkObjects(data, actual), true);
  }

, 'test uuid length for string': function() {
    var data = string.uuid(5).length
      , actual = 5;
    assert.equal(data, actual);
  }

};

module.exports = tests;
