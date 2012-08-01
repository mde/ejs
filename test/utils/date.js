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
var date = require('../../lib/utils/date').date
  , assert = require('assert')
  , tests = {}
  , _date = new Date();

tests = {

  'test strftime for date': function() {
    var data = date.strftime(_date, "%w")
      , actual = _date.getDay();
    assert.equal(data, actual);
  }

, 'test leftPad for date': function() {
    var data = date.leftPad("geddy", 7, " ")
      , actual = "  geddy";
    assert.equal(data, actual);
  }

, 'test calcCentury using current year for date': function() {
    var data = date.calcCentury()
      , actual = '21';
    assert.equal(data, actual);
  }

, 'test calcCentury using 20th century year for date': function() {
    var data = date.calcCentury(2000)
      , actual = '20';
    assert.equal(data, actual);
  }

, 'test calcCentury using 1st century year for date': function() {
    var data = date.calcCentury(10)
      , actual = '1';
    assert.equal(data, actual);
  }

, 'test getMeridiem for date': function() {
    var data = date.getMeridiem(_date.getHours())
      , actual = (_date.getHours() > 11) ? 'PM' : 'AM';
    assert.equal(data, actual);
  }

, 'test leftPad for date': function() {
    var data = date.leftPad("geddy", 7, " ")
      , actual = "  geddy";
    assert.equal(data, actual);
  }

};

module.exports = tests;
