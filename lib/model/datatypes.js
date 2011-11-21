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

  this.string = function (name, val) {
    return {
      err: null,
      val: String(val)
    };
  };

  this.number = function (name, val) {
    if (isNaN(val)) {
      return {
        err: 'Field "' + name + '" must be a Number.',
        val: null
      };
    };
    return {
      err: null,
      val: Number(val)
    };
  };

  this.int = function (name, val) {
    // Allow decimal values like 10.0 and 3.0
    if (Math.round(val) != val) {
      return {
        err: 'Field "' + name + '" must be an integer.',
        val: null
      };
    };
    return {
      err: null,
      val: parseInt(val, 10)
    };
  };

  this.boolean = function (name, val) {
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
        err: 'Field "' + name + '" must be a Boolean.',
        val: null
      };
    };
    return {
      err: null,
      val: validated
    };
  };

  this.object = function (name, val) {
    // Sure, Arrays are technically Objects, but we're treating Array as a
    // separate datatype. Remember, instanceof Array fails across window
    // boundaries, so let's also make sure the Object doesn't have a 'length'
    // property.
    if (typeof val != 'object' || _isArray(val)) {
      return {
        err: 'Field "' + name + '" must be an Object.',
        val: null
      };
    };
    return {
      err: null,
      val: val
    };
  };

  this.array = function (name, val) {
    // instanceof check can fail across window boundaries. Also check
    // to make sure there's a length property
    if (!_isArray(val)) {
      return {
        err: 'Field "' + name + '" must be an Array.',
        val: null
      };
    };
    return {
      err: null,
      val: val
    };
  };

  this.date = function (name, val) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null,
        val: dt
      };
    }
    else {
      return {
        err: 'Field "' + name + '" must be in a valid date format.',
        val: null
      };
    }
  };

  this.datetime = function (name, val) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null,
        val: dt
      };
    }
    else {
      return {
        err: 'Field "' + name + '" must be in a valid datetime format.',
        val: null
      };
    }
  };

  // This is a hack -- we're saving times as Dates of 12/31/1969, and the
  // desired time
  this.time = function (name, val) {
    var dt = geddy.date.parse(val);
    if (dt) {
      return {
        err: null,
        val: dt
      };
    }
    else {
      return {
        err: 'Field "' + name + '" must be in a valid time format.',
        val: null
      };
    }
  };

})();

module.exports = datatypes;
