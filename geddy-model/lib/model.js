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
// Example model file, would be app/models/user.js:

var User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  this.validatesConfirmed('password', 'confirmPassword');
  this.validatesWithFunction('password',
      function (s) { return s.length > 0; // Could be anything
  });
};

User.prototype.someMethod = function () {
  // Do some stuff on a User instance
};

// Server-side, commonjs
exports.User = User;
// Client-side
model.registerModel('User');
*/

var sys;

var model = new function () {
  
  // Client-side, create GLOBAL ref for top-level execution scope
  if (typeof window != 'undefined') {
    window.GLOBAL = window;
  }
  else {
    sys = require('sys');
  }

  this.dbAdapter = null;
  this.modelRegistry = {};
  
  var _constructorList = GLOBAL;

  var _createModelItemConstructor = function (def) {

      var createPropertyList = function (virtual) {
        var listName = virtual ? 'virtualProperties' : 'properties';
        var defBase = model.modelRegistry[def.name];
        var props = defBase[listName];
        var ret = {};
        var fromItem;
        var toItem;
        for (var p in props) {
          ret[p] = {};
          fromItem = props[p];
          toItem = ret[p];
          // Don't copy over the list of validations from the definition
          for (var n in fromItem) {
            if (n == 'validations') {
              continue;
            }
            toItem[n] = fromItem[n];
          }
        }
        return ret;
      };

    // FIXME: A better way to do this would be to map virtual properties
    // to instances from constructors defined by the adapter --
    // rather than just mapping a bunch of string keys to method names
    var createVirtualPropertyMethod = function (_this, virtualPropertyName, methodName, args) {
      return function () {
        return model.dbAdapter.virtual(_this, virtualPropertyName, methodName, arguments);
      }
    };

    var createVirtualProperty = function (_this, virtualPropertyName, obj) {
      var prop = {};
      var datatype = model.dbAdapter.virtualPropertyDatatypes[obj.datatype];
      if (!datatype) {
        throw new Error('No virtual-property datatypes defined in model.dbAdapter.');
      };
      var methodNames = datatype.methods;
      var methodName;
      for (var i = 0; i < methodNames.length; i++) {
        var methodName = methodNames[i];
        prop[methodName] = createVirtualPropertyMethod(_this, virtualPropertyName, methodName);
      }
      return prop;
    };

    var createAssociations = function () {
        var defBase = model.modelRegistry[def.name];
        var assoc = defBase.associations;
        var created;
        for (var p in assoc) {
          created = created || {};
          created[p] = {};
          for (var q in assoc[p]) {
            created[p][q] = {ids: []};
          }
        }
        return created;
    };

    // Base constructor function for all model items
    return function (params) {
      this.saved = params.saved || false;
      
      this.type = def.name;

      if (params.saved) {
        this.id = params.id;
        this.properties = params.properties;
        this.virtualProperties = params.virtualProperties;
        this.associations = params.associations;
      }
      else {
        this.properties = createPropertyList(false);
        this.virtualProperties = createPropertyList(true);
        this.associations = createAssociations();
      }

      this.valid = function () {
        return !this.errors;
      };

      // Callback should be in the format of function (err, result) {}
      this.save = function (callback) {
        if (this.errors) {
          if (callback) {
            callback(this.errors, null);
          }
          else {
            var err = new Error('Could not validate object. Errors: ' +
                JSON.stringify(this.errors));
            err.errors = this.errors;
            throw err;
          }
        }
        else {
          return model.dbAdapter.save(this, callback);
        }
      };

      this.updateAttributes = function (params, callback) {
        model.updateItem(this, params);
        this.save(callback);
      };

      this.toString = function () {
        var obj = {};
        obj.id = this.id;
        obj.type = this.type;
        for (var p in this.properties) {
          obj[p] = this[p];
        }
        return JSON.stringify(obj);
      };

      this.toJson = this.toString;
      
      var virtuals = this.virtualProperties;
      for (var p in virtuals) {
        this[p] = createVirtualProperty(this, p, virtuals[p]);
      }

    };
  };

  var _createStaticMethodsMixin = function (name) {
    var obj = {};
    
    obj.create = function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.createItem.apply(model, args);
    };

    obj.find = function () {
      if (!model.dbAdapter) {
        throw new Error('dbAdapter is not defined.');
      }
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.dbAdapter.find.apply(model.dbAdapter, args);
    };

    obj.all = function () {
      if (!model.dbAdapter) {
        throw new Error('dbAdapter is not defined.');
      }
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.dbAdapter.all.apply(model.dbAdapter, args);
    };

    obj.update = function () {
      if (!model.dbAdapter) {
        throw new Error('dbAdapter is not defined.');
      }
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.dbAdapter.update.apply(model.dbAdapter, args);
    };

    obj.remove = function () {
      if (!model.dbAdapter) {
        throw new Error('dbAdapter is not defined.');
      }
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.dbAdapter.remove.apply(model.dbAdapter, args);
    };
    
    // Singleton usage -- only one possible instance, and the
    // dbAdapter knows how to get it
    obj.getInstance = function () {
      if (!model.dbAdapter) {
        throw new Error('dbAdapter is not defined.');
      }
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.dbAdapter.getInstance.apply(model.dbAdapter, args);
    };

    obj.load = obj.find;
    
    return obj;
  };


  this.registerModels = function (err, dirList) {
    if (err) {
      throw new Error('Error: ' + JSON.stringify(err));
    }
    else {
      // Introspect the list of constructors from app/models/*
      var initList = util.meta.registerConstructors('/app/models/', dirList);
      _constructorList = initList;
      for (var p in _constructorList) {
        model.registerModel(p);
      }
    }
  };

  this.registerModel = function (p) {
    var ModelItemDefinition = _constructorList[p];
    // Ref to any original prototype, so we can copy stuff off it
    var origPrototype = ModelItemDefinition.prototype;
    ModelItemDefinition.prototype = new model.ModelItemDefinitionBase(p);
    model.modelRegistry[p] = new model.Model(p);
    var def = new ModelItemDefinition();
    // Create the constructor function to use when calling static
    // ModalItem.create. Gives them the proper instanceof value,
    // and .save, .valid, etc. instance-methods.
    var ModelItem = _createModelItemConstructor(def);
    // Mix any functions defined on the model-item definition 'constructor'
    // into the original prototype, and set it as the prototype of the
    // instance constructor
    for (var prop in def) {
      // Don't copy inherited stuff
      if (def.hasOwnProperty(prop)) {
        origPrototype[prop] = def[prop];
      }
    }
    ModelItem.prototype = origPrototype;
    // Mix in the static methods like .create and .load
    ModelItem = util.meta.mixin(ModelItem, _createStaticMethodsMixin(p));
    // Create a globally scoped constructor name
    GLOBAL[p] = ModelItem;
  };

  this.createItem = function (typeName, params) {
    var item = new GLOBAL[typeName](params);
    
    item = this.validateAndUpdateFromParams(item, params);
    
    // After-create hook
    if (typeof item.afterCreate == 'function') {
      item.afterCreate();
    }
    return item;
  };

  this.updateItem = function (item, params) {
    
    item = this.validateAndUpdateFromParams(item, params);
    
    // After-update hook
    if (typeof item.afterUpdate == 'function') {
      item.afterUpdate();
    }
    return item;

  };

  this.validateAndUpdateFromParams = function (item, params) {
    var type = model.modelRegistry[item.type];
    var properties = type.properties;
    var validated = null;
    var errs = null;
    var val;
    
    // May be revalidating, clear errors
    delete item.errors;

    for (var p in properties) {
      validated = this.validateProperty(properties[p], params);
      // If there are any failed validations, the errs param
      // contains an Object literal keyed by field name, and the
      // error message for the first failed validation for that
      // property
      if (validated.err) {
        errs = errs || {};
        errs[p] = validated.err;
      }
      // Otherwise add this property the the return item 
      else {
        item[p] = validated.val;
      }
    }

    if (errs) {
      item.errors = errs;
    }

    return item;
  };

  /*
   * Perform validation on each property on this model
   */
  this.validateProperty = function (prop, params) {

    var name = prop.name;
    var val = params[name];

    // Validate for the base datatype only if there actually is a value --
    // e.g., undefined will fail the validation for Number, even if the
    // field is optional
    if (val) {
      var result = model.datatypes[prop.datatype.toLowerCase()](prop.name, val);
      if (result.err) {
        return {
          err: result.err,
          val: null
        };
      }
      // Value may have been modified in the datatype check -- e.g.,
      // 'false' changed to false, '8.0' changed to 8, '2112' changed to
      // 2112, etc.
      val = result.val;
    }

    // Now go through all the base validations for this property
    var validations = prop.validations;
    var validator;
    var err;
    for (var p in validations) {
      validator = model.validators[p]
      if (typeof validator != 'function') {
        throw new Error(p + ' is not a valid validator');
      }
      err = validator(name, val, params, validations[p]);
      // If there's an error for a validation, don't bother
      // trying to continue with more validations -- just return
      // this first error message
      if (err) {
        return {
          err: err,
          val: null
        };
      }
    }

    // If there weren't any errors, return the value for this property
    // and no error
    return {
      err: null,
      val: val
    };

  };

  this.setDbAdapter = function (adapt) {
    model.dbAdapter = adapt;
  };

}();

model.Model = function (name) {
  this.name = name;
  this.properties = {};
  this.virtualProperties = {};
  this.associations = {};
};

model.Property = function (name, datatype, o) {
  var opts = o || {};
  this.name = name;
  this.datatype = datatype;
  this.options = opts;
  var validations = {};
  for (var p in opts) {
    if (opts.required || opts.length) {
      validations.present = true;
    }
    if (opts.length) {
      validations.length = opts.length;
    }
    if (opts.format) {
      validations.format = opts.format;
    }
  }
  this.validations = validations;
};

model.VirtualProperty = function (name, datatype, o) {
  var opts = o || {};
  this.name = name;
  this.datatype = datatype;
  this.options = opts;
};

/*
 * Datatype verification -- may modify the value by casting
 */
model.datatypes = new function () {
  
  var _DATE_PAT = /(\d{4})(?:\-|\/|\.)(\d{1,2})(?:\-|\/|\.)(\d{1,2})/;
  var _US_DATE_PAT = /(\d{1,2})(?:\-|\/|\.)(\d{1,2})(?:\-|\/|\.)(\d{4})/;
  var _DATETIME_PAT = /(\d{4})(?:\-|\/|\.)(\d{1,2})(?:\-|\/|\.)(\d{1,2})(?:T| )?(\d{2})?(?::)?(\d{2})?(?::)?(\d{2})?(?:\.)?(\d+)?/; 

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
    var dt;
    var y, m, d;
    var matches;
    if (val instanceof Date || typeof val.getFullYear == 'function') {
      dt = val;
    }
    // Value preparsed, looks like [yyyy, mm, dd]
    else if (_isArray(val)) {
      y = parseInt(val[0], 10);
      m = parseInt(val[1], 10) - 1;
      d = parseInt(val[2], 10);
      dt = new Date(y, m, d);
    }
    else if (typeof val == 'string') {
      matches = val.match(_DATE_PAT);
      if (matches) {
        matches.shift(); // First match is entire match
        y = parseInt(matches.shift(), 10);
        m = parseInt(matches.shift(), 10) - 1;
        d = parseInt(matches.shift(), 10);
        dt = new Date(y, m, d);
      }
      else {
        matches = val.match(_US_DATE_PAT);
        if (matches) {
          matches.shift(); // First match is entire match
          m = parseInt(matches.shift(), 10) - 1;
          d = parseInt(matches.shift(), 10);
          y = parseInt(matches.shift(), 10);
          dt = new Date(y, m, d);
        }
      }
    }
    else if (typeof val == 'number') {
      dt = new Date(val);
    }

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
    var dt;
    var y, mo, d, h, mi, s, ms;
    var matches;
    if (val instanceof Date || typeof val.getFullYear == 'function') {
      dt = val;
    }
    // Value preparsed, looks like [yyyy, mo, dd, hh, mi, ss, ms]
    else if (_isArray(val)) {
      y = parseInt(val[0], 10);
      mo = parseInt(val[1], 10) - 1;
      d = parseInt(val[2], 10);
      h = parseInt(val[3], 10) || 0;
      mi = parseInt(val[4], 10) || 0;
      s = parseInt(val[5], 10) || 0;
      ms = parseInt(val[6], 10) || 0;
      dt = new Date(y, mo, d, h, mi, s, ms);
    }
    else if (typeof val == 'string') {
      matches = val.match(_DATETIME_PAT);
      if (matches) {
        matches.shift(); // First match is entire match
        y = parseInt(matches.shift(), 10);
        mo = parseInt(matches.shift(), 10) - 1;
        d = parseInt(matches.shift(), 10);
        h = parseInt(matches.shift(), 10) || 0;
        mi = parseInt(matches.shift(), 10) || 0;
        s = parseInt(matches.shift(), 10) || 0;
        ms = parseInt(matches.shift(), 10) || 0;
        dt = new Date(y, mo, d, h, mi, s, ms);
      }
    }
    else if (typeof val == 'number') {
      dt = new Date(val);
    }

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

}();

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
model.validators = {
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

model.ModelItemDefinitionBase = function (name) {
  this.name = name;

  this.property = function (name, datatype, o) {
    model.modelRegistry[this.name].properties[name] =
      new model.Property(name, datatype, o);
  };

  this.virtualProperty = function (name, datatype, o) {
    model.modelRegistry[this.name].virtualProperties[name] =
      new model.VirtualProperty(name, datatype, o);
  };

  this.validates = function (condition, name, qual, opts) {
    var rule = util.meta.mixin({}, opts, true);
    rule.qualifier = qual;
    model.modelRegistry[this.name].properties[name].validations[condition] = rule;
  };

  // For each of the validators, create a validatesFooBar from
  // validates('fooBar' ...
  var _this = this;
  var _getValidator = function (p) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(p);
      return _this.validates.apply(_this, args);
    };
  };
  for (var p in model.validators) {
    this['validates' + util.string.capitalize(p)] = _getValidator(p);
  }

  this.hasMany = function (datatype, opts) {
    var key = inflections[datatype];
    if (!key) {
      throw new Error('Unknown model "' + datatype + '"')
    }
    key = key.constructor.plural;
    var def = model.modelRegistry[this.name];
    var assoc = def.associations.hasMany || {};
    assoc[key] = {};
    def.associations.hasMany = assoc;
  };

  this.belongsTo = function (datatype, opts) {
    var key = inflections[datatype];
    if (!key) {
      throw new Error('Unknown model "' + datatype + '"')
    }
    key = key.constructor.plural;
    var def = model.modelRegistry[this.name];
    var assoc = def.associations.belongsTo || {};
    assoc[key] = {};
    def.associations.belongsTo = assoc;
  };

};

// Server-side, add everything to exports
if (typeof window == 'undefined') {
  for (var p in model) { this[p] = model[p]; }
}

