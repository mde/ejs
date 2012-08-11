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
var xml = require('../../lib/utils/xml').XML
  , assert = require('assert')
  , tests = {};

tests = {

  'test setIndentLevel for xml': function() {
    var data = xml.setIndentLevel(5)
      , actual = 5;
    assert.equal(data, actual)
  }

, 'test stringify with object for xml': function() {
    var data = xml.stringify({user: 'name'})
      , actual = '<?xml version="1.0" encoding="UTF-8"?>\n<object>\n    <user>name</user>\n</object>\n';
    assert.equal(data, actual)
  }

, 'test stringify with array for xml': function() {
    var data = xml.stringify(['user'])
      , actual = '<?xml version="1.0" encoding="UTF-8"?>\n<strings type="array">\n\
    <string>user</string>\n</strings>';
    assert.equal(data, actual)
  }

, 'test stringify with object and no whitespace for xml': function() {
    var data = xml.stringify({user: 'name'}, {whitespace: false})
      , actual = '<?xml version="1.0" encoding="UTF-8"?><object><user>name</user></object>';
    assert.equal(data, actual)
  }

, 'test stringify with object and name for xml': function() {
    var data = xml.stringify({user: 'name'}, {name: 'omg'})
      , actual = '<?xml version="1.0" encoding="UTF-8"?>\n<omg>\n<user>name</user>\n</omg>\n';
    assert.equal(data, actual)
  }

, 'test stringify with object and fragment for xml': function() {
    var data = xml.stringify({user: 'name'}, {fragment: true})
      , actual = '<object>\n<user>name</user>\n</object>\n';
    assert.equal(data, actual)
  }

, 'test stringify with object for xml': function() {
    var data = xml.stringify({user: 'name'}, {level: 1})
      , actual = '<?xml version="1.0" encoding="UTF-8"?>\n         <user>name</user>\n';
    assert.equal(data, actual)
  }

, 'test stringify with array and no arrayRoot for xml': function() {
    var data = xml.stringify(['user'], {arrayRoot: false})
      , actual = '<?xml version="1.0" encoding="UTF-8"?>\n<strings type="array">\n\
<string>user</string>\n</strings>';
    assert.equal(data, actual)
  }

};

module.exports = tests;
