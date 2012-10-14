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

var i18n = require('utilities').i18n;

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
  present: function (name, val, params, rule, locale) {
    var msg;
    if (!val) {
      //'Field "' + name + '" is required.';
      msg = rule.message || i18n.getText('model.validatesPresent',
        {name: name}, locale);
    }
    return msg;
  },

  absent: function (name, val, params, rule, locale) {
    var msg;
    if (val) {
      //return rule.message || 'Field "' + name + '" must not be filled in.';
      msg = rule.message || i18n.getText('model.validatesAbsent',
        {name: name}, locale);
    }
    return msg;
  },

  confirmed: function (name, val, params, rule, locale) {
    var qual = rule.qualifier
      , msg;
    if (val != params[qual]) {
      //return rule.message || 'Field "' + name + '" and field "' + qual +
      //    '" must match.';
      msg = rule.message || i18n.getText('model.validatesConfirmed',
        {name: name, qual: qual}, locale);
    }
    return msg;
  },

  format: function (name, val, params, rule, locale) {
    var msg;
    if (!rule.qualifier.test(val)) {
      //return rule.message || 'Field "' + name + '" is not correctly formatted.';
      msg = rule.message || i18n.getText('model.validatesFormat',
        {name: name}, locale);
    }
    return msg;
  },

  length: function (name, val, params, rule, locale) {
    var qual = rule.qualifier
      , err
      , msg;
    if (!val) {
      return rule.message || 'Field "' + name + '" is required.';
    }
    if (typeof qual == 'number') {
      if (val.length != qual) {
        //return rule.message || 'Field "' + name + '" must be ' + qual +
        //    ' characters long.';
        msg = rule.message || i18n.getText('model.validatesExactLength',
          {name: name}, locale);
      }
    }
    else {
      if (typeof qual.min == 'number' && val.length < qual.min) {
        //return rule.message || 'Field "' + name + '" must be at least ' +
        //    qual.min + ' characters long.';
        msg = rule.message || i18n.getText('model.validatesMinLength',
          {name: name, min: qual.min}, locale);
      }
      if (typeof qual.max == 'number' && val.length > qual.max) {
        //return rule.message || 'Field "' + name + '" may not be more than ' +
        //    qual.max + ' characters long.';
        msg = rule.message || i18n.getText('model.validatesMaxLength',
          {name: name, max: qual.max}, locale);
      }
    }
    return msg;
  },

  withFunction: function (name, val, params, rule, locale) {
    var func = rule.qualifier
      , msg;
    if (typeof func != 'function') {
      throw new Error('withFunction validator for field "' + name +
          '" must be a function.');
    }
    if (!func(val, params)) {
      //return rule.message || 'Field "' + name + '" is not valid.';
      msg = rule.message || i18n.getText('model.validatesWithFunction',
        {name: name}, locale);
    }
    return msg;
  }
};

module.exports = validators;
