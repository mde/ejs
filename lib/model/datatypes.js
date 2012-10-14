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
 * Datatype verification -- may modify the value by casting
 */
var datatypes = new (function () {

  var _isArray = function (obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  this.string = function (name, val, locale) {
    return {
      err: null
    , val: String(val)
    };
  };

  this.number = function (name, val, locale) {
    if (isNaN(val)) {
      return {
        err: i18n.getText('model.validatesNumber', {name: name}, locale)
      , val: null
      };
    };
    return {
      err: null
    , val: Number(val)
    };
  };

  this.int = function (name, val, locale) {
    // Allow decimal values like 10.0 and 3.0
    if (Math.round(val) != val) {
      return {
        err: i18n.getText('model.validatesInteger', {name: name}, locale)
      , val: null
      };
    };
    return {
      err: null
    , val: parseInt(val, 10)
    };
  };

  this.boolean = function (name, val, locale) {
    var validated;
    switch (typeof val) {
      case 'string':
        if (val == 'true') {
          validated = true;
        }
        else if (val == 'false') {
          validated = false;
        }
        break;
      case 'number':
        if (val == 1) {
          validated = true;
        }
        else if (val == 0) {
          validated = false;
        }
        break;
      case 'boolean':
        validated = val;
        break;
      default:
        // Nothing
    }

    if (typeof validated != 'boolean') {
      return {
        err: i18n.getText('model.validatesBoolean', {name: name}, locale)
      , val: null
      };
    };
    return {
      err: null
      , val: validated
    };
  };

  this.object = function (name, val, locale) {
    // Sure, Arrays are technically Objects, but we're treating Array as a
    // separate datatype. Remember, instanceof Array fails across window
    // boundaries, so let's also make sure the Object isn't Array-ish
    if (typeof val != 'object' || _isArray(val)) {
      return {
        err: i18n.getText('model.validatesObject', {name: name}, locale)
      , val: null
      };
    };
    return {
      err: null
    , val: val
    };
  };

  this.array = function (name, val, locale) {
    // instanceof check can fail across window boundaries. Also check
    // to make sure there's a length property
    if (!_isArray(val)) {
      return {
        err: i18n.getText('model.validatesArray', {name: name}, locale)
      , val: null
      };
    };
    return {
      err: null
    , val: val
    };
  };

  this.date = function (name, val, locale) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null
      , val: dt
      };
    }
    else {
      return {
        err: i18n.getText('model.validatesDate', {name: name}, locale)
      , val: null
      };
    }
  };

  this.datetime = function (name, val, locale) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null
      , val: dt
      };
    }
    else {
      return {
        err: i18n.getText('model.validatesDatetime', {name: name}, locale)
      , val: null
      };
    }
  };

  // This is a hack -- we're saving times as Dates of 12/31/1969, and the
  // desired time
  this.time = function (name, val, locale) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null
      , val: dt
      };
    }
    else {
      return {
        err: i18n.getText('model.validatesTime', {name: name}, locale)
      , val: null
      };
    }
  };

})();

module.exports = datatypes;
