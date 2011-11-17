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

/*
 * Basic validators -- name is the field name, params is the entire params
 * collection (needed for stuff like password confirmation so it's possible
 * to compare with other field values, and the rule is the data for this
 * particular validation
 * Rules can look like this:
 * present: {qualifier: true, {message: 'Gotta be here'}}
 * length: {qualifier: {min: 2, max: 12}}
 * withFunction: {qualifier: function (s) { return true },
 *    message: 'Something is wrong'}
 */
var validators = {
  present: function (name, val, params, rule) {
    if (!val) {
      return rule.message || 'Field "' + name + '" is required.';
    }
  },

  absent: function (name, val, params, rule) {
    if (val) {
      return rule.message || 'Field "' + name + '" must not be filled in.';
    }
  },

  confirmed: function (name, val, params, rule) {
    var qual = rule.qualifier;
    if (val != params[qual]) {
      return rule.message || 'Field "' + name + '" and field "' + qual +
          '" must match.';
    }
  },

  format: function (name, val, params, rule) {
    if (!rule.qualifier.test(val)) {
      return rule.message || 'Field "' + name + '" is not correctly formatted.';
    }
  },

  length: function (name, val, params, rule) {
    var qual = rule.qualifier;
    var err;
    if (!val) {
      return rule.message || 'Field "' + name + '" is required.';
    }
    if (typeof qual == 'number') {
      if (val.length != qual) {
        return rule.message || 'Field "' + name + '" must be ' + qual +
            ' characters long.';
      }
    }
    else {
      if (typeof qual.min == 'number' && val.length < qual.min) {
        return rule.message || 'Field "' + name + '" must be at least ' +
            qual.min + ' characters long.';
      }
      if (typeof qual.max == 'number' && val.length > qual.max) {
        return rule.message || 'Field "' + name + '" may not be more than ' +
            qual.max + ' characters long.';
      }
    }
  },

  withFunction: function (name, val, params, rule) {
    var func = rule.qualifier;
    if (typeof func != 'function') {
      throw new Error('withFunction validator for field "' + name +
          '" must be a function.');
    }
    if (!func(val, params)) {
      return rule.message || 'Field "' + name + '" is not valid.';
    }
  }
};

module.exports = validators;
