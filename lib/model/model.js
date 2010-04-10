var sys = require('sys');

var meta = require('geddy/lib/util/meta');

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
      validated = this.validateAttribute(attrList[p], val);
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

  this.validateAttribute = function (attr, val) {
    var validatedVal = val;
    var result = {
      err: null,
      val: null
    };
    
    // First check to see if value is required, before doing any other
    // rule checking
    if (attr.opts.required) {
      delete attr.opts.required; // Don't do this with all the other opts
      if (!validatedVal) {
        return {
          err: 'Field "' + attr.name + '" is required.',
          val: null
        };
      }
    }

    // Validate for the base datatype only if there actually is a value --
    // e.g., undefined will fail the validation for Number, even if the
    // field is optional
    if (validatedVal) {
      result = model.validators[attr.dataType](attr.name, validatedVal);
      if (result.err) {
        return result;
      }
      // Value may have been modified in the datatype check -- e.g.,
      // 'false' changed to false, '8.0' changed to 8, '2112' changed to 2112, etc.
      validatedVal = result.val;
    }

    // Check any other validators -- user could always add other rules like
    // minLength that makes ostensibly non-required values actually required
    var opts = attr.opts;
    for (p in opts) {
      result = model.validators[p](attr.name, validatedVal, opts[p]);
      if (result.err) {
        return result;
      }
    }
    
    return result;
  };

}();

var ModelFactory = function (name) {
  this.name = name;
  this.property = function (name, dataType, o) {
    modelRegistry[this.name].attributes[name] =
      new model.Attribute(name, dataType, o);
  };
  modelRegistry[name] = new model.Model(name);
};

model.Model = function (name) {
  this.name = name;
  this.attributes = {};
};

model.Attribute = function (name, dataType, opts) {
  this.name = name;
  this.dataType = dataType;
  this.opts = opts || {};
};

model.validators = {
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
  },
  
  'minLength': function (name, val, qual) {
    validated = val || '';
    if (validated.length < qual) {
      return {
        err: 'Field "' + name + '" must be at least ' + qual + ' characters long.',
        val: null
      };
    };
    return {
      err: null,
      val: validated
    };
  },

  'maxLength': function (name, val, qual) {
    validated = val || '';
    if (validated.length > qual) {
      return {
        err: 'Field "' + name + '" may not be longer than ' + qual + ' characters.',
        val: null
      };
    };
    return {
      err: null,
      val: validated
    };
  },

  'minValue': function (name, val, qual) {
    if (val < qual) {
      return {
        err: 'Field "' + name + '" must be at least ' + qual,
        val: null
      };
    };
    return {
      err: null,
      val: val
    };
  },

  'maxValue': function (name, val, qual) {
    if (val > qual) {
      return {
        err: 'Field "' + name + '" must not be more than ' + qual,
        val: null
      };
    };
    return {
      err: null,
      val: val
    };
  }


};

for (var p in model) { this[p] = model[p]; }

