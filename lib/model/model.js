var sys = require('sys');

var meta = require('geddy/lib/util/meta');
var fleegix = require('geddy/lib/fleegix');

var model = new function () {
  GLOBAL.modelRegistry = {};

  this.registerModels = function (err, dirList) {
    if (err) {
      sys.puts('Error: ' + JSON.stringify(err));
    }
    else {
      var initList = meta.registerConstructors('/app/models/', dirList);
      for (var p in initList) {
        var creatorConstructor = initList[p];
        creatorConstructor.prototype = new ModelCreator(p);
        new creatorConstructor();
        // Dummy constructor for instanceof check, e.g. model.User
        model[p] = function (type) { this.type = type };
      }
    }
  };

  /*
   * First basic CRUD action, create
   * Next needs to pass off to desired datastore and save
   */
  this.createObject = function (typeName, params, callback) {
    var obj = new model[typeName](typeName);
    var type = modelRegistry[typeName];
    var attrList = type.attributes;
    var validated = null;
    var errs = null;
    var val;
    for (var p in attrList) {
      val = params[p];
      validated = this.validateAttribute(attrList[p], params);
      // If there are any failed validations, the errs param
      // contains an Object literal keyed by field name, and the
      // error message for the first failed validation for that
      // attribute
      if (validated.err) {
        errs = errs || {};
        errs[p] = validated.err;
      }
      // Otherwise add this attribute the the return obj
      else {
        obj[p] = validated.val;
      }
    }

    // If there were any failed validations, don't bother returning
    // the invalid object
    if (errs) { obj = null };
    
    callback(errs, obj);
  };

  /*
   * Perform validation on each attribute on this model
   */
  this.validateAttribute = function (attr, origParams) {
    // Make a copy of the params being passed in
    var params = fleegix.mixin({}, origParams, true);

    var name = attr.name;
    var val = params[name];
    
    // Validate for the base datatype only if there actually is a value --
    // e.g., undefined will fail the validation for Number, even if the
    // field is optional
    if (val) {
      var result = model.datatypes[attr.datatype](attr.name, val);
      if (result.err) {
        return {
          err: result.err,
          val: null
        };
      }
      // Value may have been modified in the datatype check -- e.g.,
      // 'false' changed to false, '8.0' changed to 8, '2112' changed to
      // 2112, etc.
      params[name] = result.val;
    }

    // Now go through all the base validations for this attribute
    var validations = attr.validations;
    var validator;
    var err;
    for (var p in validations) {
      validator = model.validators[p]
      if (typeof validator != 'function') {
        throw new Error(p + ' is not a valid validator');
      }
      err = validator(name, params, validations[p]);
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

    // If there weren't any errors, return the value for this attribute
    // and no error
    return {
      err: null,
      val: params[name]
    };

  };

}();

model.Model = function (name) {
  this.name = name;
  this.attributes = {};
};

model.Attribute = function (name, datatype, o) {
  var opts = o || {};
  this.name = name;
  this.datatype = datatype;
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

/*
 * Datatype verification -- may modify the value by casting
 */
model.datatypes = {
  'String': function (name, val) {
    return {
      err: null,
      val: new String(val)
    };
  },

  'Number': function (name, val) {
    if (isNaN(val)) {
      return {
        err: 'Field "' + name + '" must be a Number.',
        val: null
      };
    };
    return {
      err: null,
      val: new Number(val)
    };
  },

  'int': function (name, val) {
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
  },

  'Boolean': function (name, val) {
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
  }

};

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
  present: function (name, params, rule) {
    if (!params[name]) {
      return rule.message || 'Field "' + name + '" is required.';
    }
  },

  absent: function (name, params, rule) {
    if (params[name]) {
      return rule.message || 'Field "' + name + '" must not be filled in.';
    }
  },

  confirmed: function (name, params, rule) {
    if (params[name] != params[rule.qualifier]) {
      return rule.message || 'Field "' + name + '" and field "' + qual +
          '" must match.';
    }
  },

  format: function (name, params, rule) {
    if (!rule.qualifier.test(params[name])) {
      return rule.message || 'Field "' + name + '" is not correctly formatted.';
    }
  },

  length: function (name, params, rule) {
    var qual = rule.qualifier;
    var val = params[name];
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

  withFunction: function (name, params, rule) {
    var func = rule.qualifier;
    if (typeof func != 'function') {
      throw new Error('withFunction validator for field "' + name +
          '" must be a function.');
    }
    if (!func(params[name], params)) {
      return rule.message || 'Field "' + name + '" is not valid.';
    }
  }

};

var ModelCreator = function (name) {
  var _this = this;
  // Create validatesLength( from validates('length' ...
  var _getValidator = function (p) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(p);
      return _this.validates.apply(_this, args);
    };
  };

  this.name = name;

  this.property = function (name, datatype, o) {
    modelRegistry[this.name].attributes[name] =
      new model.Attribute(name, datatype, o);
  };

  this.validates = function (condition, name, qual, opts) {
    var rule = fleegix.mixin({}, opts, true);
    rule.qualifier = qual;
    modelRegistry[this.name].attributes[name].validations[condition] = rule;
  };

  // For each of the validators, create a validatesFooBar from
  // validates('fooBar' ...
  for (var p in model.validators) {
    this['validates' + fleegix.string.capitalize(p)] = _getValidator(p);  
  }
  
  modelRegistry[name] = new model.Model(name);
};

for (var p in model) { this[p] = model[p]; }

