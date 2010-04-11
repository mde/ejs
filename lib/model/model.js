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
        var constructor = initList[p];
        constructor.prototype = new ModelFactory(p);
        new constructor();
        model[p] = function (type) { this.type = type }; // Dummy constructor for instanceof check
      }
    }
  };

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
      if (validated.err) {
        errs = errs || {};
        errs[p] = validated.err;
      }
      else {
        if (!errs) {
          obj[p] = validated.val;
        }
      }
    }
    if (errs) { obj = null };
    callback(errs, obj);
  };

  this.validateAttribute = function (attr, origParams) {

    var params = fleegix.mixin({}, origParams, true);
    var name = attr.name;
    var val = params[name];
    // Validate for the base datatype only if there actually is a value --
    // e.g., undefined will fail the validation for Number, even if the
    // field is optional
    if (val) {
      var result = model.datatypes[attr.dataType](attr.name, val);
      if (result.err) {
        return {
          err: result.err,
          val: null
        };
      }
      // Value may have been modified in the datatype check -- e.g.,
      // 'false' changed to false, '8.0' changed to 8, '2112' changed to 2112, etc.
      params[name] = result.val;
    }

    var validations = attr.validations;
    var validator;
    var err;
    for (var p in validations) {
      validator = model.validators[p]
      if (typeof validator != 'function') {
        throw new Error(p + ' is not a valid validator');
      }
      err = validator(name, params, validations[p]);
      if (err) {
        return {
          err: err,
          val: null
        };
      }
    }

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

model.Attribute = function (name, dataType, o) {
  var opts = o || {};
  this.name = name;
  this.dataType = dataType;
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

var ModelFactory = function (name) {
  var _this = this;
  var _getValidator = function (p) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(p);
      return _this.validates.apply(_this, args);
    };
  };

  this.name = name;

  this.property = function (name, dataType, o) {
    modelRegistry[this.name].attributes[name] =
      new model.Attribute(name, dataType, o);
  };

  this.validates = function (condition, name, qual, origOpts) {
    var opts = fleegix.mixin({}, origOpts, true);
    opts.qualifier = qual;
    modelRegistry[this.name].attributes[name].validations[condition] = opts;
  };

  for (var p in model.validators) {
    this['validates' + fleegix.string.capitalize(p)] = _getValidator(p);  
  }
  
  modelRegistry[name] = new model.Model(name);
};

for (var p in model) { this[p] = model[p]; }

