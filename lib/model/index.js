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
Example model file, would be app/models/user.js:

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

User = geddy.model.register('User', User);
*/

var model = {}
  , utils = require('utilities')
  , i18n = utils.i18n;

model.datatypes = require('./datatypes.js');
model.validators = require('./validators.js');
model.formatters = require('./formatters.js');

utils.mixin(model, new (function () {

  this.adapter = null;
  this.descriptionRegistry = {};
  this.useTimestamps = false;
  this.forceCamel = true;

  var _createModelItemConstructor = function (def) {
    // Base constructor function for all model items
    var ModelItemConstructor = function (params) {
      var self = this;
      this.type = def.name;
      // Items fetched from an API should have this flag set to true
      this.saved = params.saved || false;

      // If fetched and instantiated from an API-call, give the
      // instance the appropriate ID -- newly created objects won't
      // have one until saved
      if (params.saved) {
        this.id = params.id;
      }

      this.isValid = function () {
        return !this.errors;
      };

      /**
        @name ModelBase#save
        @public
        @function
        @description Saves an instance of a Geddy ModelBase
        @param {Object} [opts]
          @param {String} [opts.locale=null] Optional locale for
          localizing error messages from validations
        @param {Function} [callback] Callback function that receives
        the result of the save action -- should be in the format of
        function (err, result) {}
       */
      this.save = function () {
        var args = Array.prototype.slice.call(arguments)
          , arg
          , opts
          , callback;
        while ((arg = args.shift())) {
          if (typeof arg == 'function') {
            callback = arg;
          }
          else {
            opts = arg;
          }
        }
        if (this.errors) {
          callback(this.errors, null);
        }
        else {
          if (model.useTimestamps && this.saved) {
            this.updatedAt = new Date();
          }
          model.adapter[this.type].save(this, opts, callback);
        }
      };

      /**
        @name ModelBase#updateAttributes
        @public
        @function
        @description Updates the attributes an instance of a Geddy
        ModelBase, and validate the changes
        @param {Object} params Object-literal with updated values for
        the instance
        the result of the save action -- should be in the format of
        function (err, result) {}
        @param {Object} [opts]
          @param {String} [opts.locale=null] Optional locale for
          localizing error messages from validations
       */
      this.updateAttributes = function (params, opts) {
        geddy.model.updateItem(this, params, opts || {});
      };

      /**
        @name ModelBase#toObj
        @public
        @function
        @description Returns an object with just the properties
        and values of the model instance
       */
      this.toObj = function () {
        var obj = {};

        for (var p in this) {
          // TODO: Make this so it hides functions and the
          // - props 'type' 'saved' and 'adapter'
          if ((typeof this[p] !== 'function') &&
              p !== 'adapter' && p !== 'type') {
            obj[p] = this[p];
          }
        }

        return obj;
      }

      this.toString = function () {
        var obj = {}
          , props = this.properties
          , formatter;

        obj.id = this.id;
        obj.type = this.type;

        for (var p in props) {
          formatter = model.formatters[props[p].datatype];
          obj[p] = typeof formatter == 'function' ? formatter(this[p]) : this[p];
        }

        return JSON.stringify(obj);
      };

      this.toJson = this.toString;

      if (geddy.model.descriptionRegistry[this.type].relations.hasMany) {
        var hasMany = geddy.model.descriptionRegistry[this.type].relations.hasMany;
        this[geddy.string.decapitalize(hasMany)] = function (query, opts, callback) {
          query = query || {};
          opts = opts || {};
          callback = callback || function () {};
          query[this.type.toLowerCase() + 'id'] = this.id;
          geddy.model.adapter[geddy.inflection.singularize(hasMany)].all(query, opts, callback);
        }
      }

      if (geddy.model.descriptionRegistry[this.type].relations.hasOne) {
        var hasOne = geddy.model.descriptionRegistry[this.type].relations.hasOne;
        this[geddy.string.decapitalize(hasOne)] = function (callback) {
          var query = {};
          query[this.type.toLowerCase() + 'id'] = this.id;
          geddy.model.adapter[hasOne].load(query, {}, callback);
        }
      }

      if (geddy.model.descriptionRegistry[this.type].relations.belongsTo) {
        var belongsTo = geddy.model.descriptionRegistry[this.type].relations.belongsTo;
        this[geddy.string.decapitalize(belongsTo)] = function (callback) {
          geddy.model.adapter[belongsTo].load(this[geddy.string.decapitalize(belongsTo)
              + 'id'], {}, callback);
        }
      }

    };

    return ModelItemConstructor;
  };

  var _createStaticMethodsMixin = function (name) {
    var obj = {}
      , createAPIMethod = function (method) {
          return function () {
            var adapt;
            if (!model.adapter) {
              throw new Error('geddy.model.adapter is not defined.');
            }
            adapt = model.adapter[name];
            return adapt[method].apply(adapt, arguments);
          };
        };

    /**
      @name ModelBase.create
      @public
      @static
      @function
      @description Creates an instance of a Geddy ModelBase, validating
      the input parameters
      @param {Object} params Object-literal with updated values for
      the instance
      the result of the save action -- should be in the format of
      function (err, result) {}
      @param {Object} [opts]
        @param {String} [opts.locale=null] Optional locale for
        localizing error messages from validations
     */
    obj.create = function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(name);
      return model.createItem.apply(model, args);
    };

    // Create statics that invoke the same model-name/method
    // combination on the model.adapter, e.g.:
    // FooBar.load => geddy.model.adapter.FooBar.load
    ['load', 'update', 'remove', 'save'].forEach(function (method) {
      obj[method] = createAPIMethod(method);
    });

    return obj;
  };

  this.register = function (name, ModelDefinition) {
    var origProto = ModelDefinition.prototype
      , defined
      , ModelCtor;

    // Create the place to store the metadata about the model structure
    // to use to do validations, etc. when constructing
    model.descriptionRegistry[name] = new model.ModelDescription(name);
    // Execute all the definition methods to create that metadata
    ModelDefinition.prototype = new model.ModelDefinitionBase(name);
    defined = new ModelDefinition();

    // Create the constructor function to use when calling static
    // ModelCtor.create. Gives them the proper instanceof value,
    // and .valid, etc. instance-methods.
    ModelCtor = _createModelItemConstructor(defined);

    // Mix in the static methods like .create and .load
    utils.mixin(ModelCtor, _createStaticMethodsMixin(name));
    // Same with statics
    utils.mixin(ModelCtor, defined);

    // Mix any functions defined directly in the model-item definition
    // 'constructor' into the original prototype, and set it as the prototype of the
    // actual constructor
    utils.mixin(origProto, defined);

    ModelCtor.prototype = origProto;

    model[name] = ModelCtor;

    return ModelCtor;
  };

  this.createItem = function (name, params, opts) {
    var item = new model[name](params);
    item = this.validateAndUpdateFromParams(item, params, opts);

    if (this.useTimestamps && !item.createdAt) {
      item.createdAt = new Date();
    }

    // After-create hook
    if (typeof item.afterCreate === 'function') {
      item.afterCreate();
    }
    return item;
  };

  this.updateItem = function (item, params) {
    item = this.validateAndUpdateFromParams(item, params);

    // After-update hook
    if (typeof item.afterUpdate === 'function') {
      item.afterUpdate();
    }
    return item;
  };

  this.validateAndUpdateFromParams = function (item, passedParams, opts) {
    var params
      , type = model.descriptionRegistry[item.type]
      , properties = type.properties
      , validated = null
      , errs = null
      , camelizedKey
      , val;

    // May be revalidating, clear errors
    delete item.errors;

    // Convert snake_case names in params to camelCase
    if (this.forceCamel) {
      params = {};
      for (var p in passedParams) {
        // Allow leading underscores in the keys for pseudo-privates
        camelizedKey = geddy.string.camelize(p, {leadingUnderscore: true});
        params[camelizedKey] = passedParams[p];
      }
    }
    else {
      params = passedParams;
    }

    // User-input should never contain these -- but we still want
    // to validate them to make sure the format didn't get fucked up
    if (typeof item.createdAt != 'undefined') {
      params.createdAt = item.createdAt;
    }
    if (typeof item.updatedAt != 'undefined') {
      params.updatedAt = item.updatedAt;
    }

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
      // Otherwise add this property to the return item
      else {
        item[p] = validated.val;
      }
    }

    // Should never have been incuded in user input, so safe to
    // rm these from the params
    delete params.createdAt;
    delete params.updatedAt;

    if (errs) {
      item.errors = errs;
    }

    return item;
  };

  this.validateProperty = function (prop, params, opts) {
    var options = opts || {}
      , name = prop.name
      , val = params[name]
      , result
      , locale = options.locale || geddy.config.i18n.defaultLocale;

    // Validate for the base datatype only if there actually is a value --
    // e.g., undefined will fail the validation for Number, even if the
    // field is optional
    if (val) {
      // 'Any' datatype
      if (prop.datatype == '*') {
        result = {
          val: val
        };
      }
      // Specific datatype -- perform validation/type-coercion
      else {
        result = model.datatypes[
            prop.datatype.toLowerCase()](prop.name, val, locale);
        if (result.err) {
          return {
            err: result.err,
            val: null
          };
        }
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
      err = validator(name, val, params, validations[p], locale);
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

})());

model.ModelDefinitionBase = function (name) {
  var self = this
    , _getValidator = function (p) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(p);
      return self.validates.apply(self, args);
    };
  };

  this.name = name;
  this.property = function (name, datatype, o) {
    model.descriptionRegistry[this.name].properties[name] =
      new model.PropertyDescription(name, datatype, o);
  };

  this.defineProperties = function (obj) {
    for (var property in obj) {
      this.property(property, obj[property].type, obj);
    }
  }

  this.validates = function (condition, name, qualifier, opts) {
    var rule = utils.mixin({}, opts, true);
    rule.qualifier = qualifier;
    model.descriptionRegistry[this.name].properties[name]
        .validations[condition] = rule;
  };

  // For each of the validators, create a validatesFooBar from
  // validates('fooBar' ...
  for (var p in model.validators) {
    this['validates' + utils.string.capitalize(p)] = _getValidator(p);
  }

  // Add the base model properties -- these should not be handled by user input
  if (model.useTimestamps) {
    this.property('createdAt', 'datetime');
    this.property('updatedAt', 'datetime');
  }

  this.hasMany = function (pluralCtorName) {
    geddy.model.descriptionRegistry[this.name].relations.hasMany = pluralCtorName;
  };

  this.belongsTo = function (ctorName) {
    geddy.model.descriptionRegistry[this.name].relations.belongsTo = ctorName;
    this.property(ctorName.toLowerCase()+'id', 'string');
  }

  this.hasOne = function (ctorName) {
    geddy.model.descriptionRegistry[this.name].relations.hasOne = ctorName;
  }

};

model.ModelDescription = function (name) {
  this.name = name;
  this.properties = {};
  this.relations = {};
};

model.PropertyDescription = function (name, datatype, o) {
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

module.exports = model;

