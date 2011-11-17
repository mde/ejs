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


var model = {};

model.validations = require('./validations.js');
model.formatters = require('./formatters.js');

geddy.mixin(model, new (function () {

  var _createModelItemConstructor = function (def) {
    var createPropertyList = function () {
        var defBase = geddy.model.modelRegistry[def.name];
        var props = defBase.properties;
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

    // Base constructor function for all model items
    var ModelItemConstructor = function (params) {
      this.type = def.name;
      this.properties = createPropertyList();

      this.valid = function () {
        return !this.errors;
      };

      this.toString = function () {
        var obj = {};
        obj.id = this.id;
        obj.type = this.type;
        var props = this.properties;
        var formatter;
        for (var p in props) {
          formatter = model.formatters[props[p].datatype];
          obj[p] = typeof formatter == 'function' ? formatter(this[p]) : this[p];
        }
        return JSON.stringify(obj);
      };

      this.toJson = this.toString;
    };

    return ModelItemConstructor;
  };

  this.reg = {};
  this.register = function (name, ModelDefinition) {
    var origProto = ModelDefinition.prototype
      , defined
      , ModelCtor;

    // Create the place to store the metadata about the model structure
    // to use to do validations, etc. when constructing
    model.reg[name] = new model.ModelDescription(name);
    // Execute all the definition methods to create that metadata
    ModelDefinition.prototype = new model.ModelDefinitionBase(name);
    defined = new ModelDefinition();

    // Create the constructor function to use when calling static
    // ModelCtor.create. Gives them the proper instanceof value,
    // and .valid, etc. instance-methods.
    ModelCtor = _createModelItemConstructor(defined);

    // Mix any functions defined directly in the model-item definition
    // 'constructor' into the original prototype, and set it as the prototype of the
    // actual constructor
    geddy.mixin(origProto, defined);
    // Same with statics
    geddy.mixin(origProto, defintion);

    ModelCtor.prototype = origProto;

    model[name] = ModelCtor;
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
    model.reg[this.name].properties[name] =
      new model.PropertyDefinition(name, datatype, o);
  };

  this.validates = function (condition, name, qualfier, opts) {
    var rule = geddy.mixin({}, opts, true);
    rule.qualifier = qualifier;
    model.reg[this.name].properties[name]
        .validations[condition] = rule;
  };

  // For each of the validators, create a validatesFooBar from
  // validates('fooBar' ...
  for (var p in model.validators) {
    this['validates' + geddy.string.capitalize(p)] = _getValidator(p);
  }

};

model.ModelDescription = function (name) {
  this.name = name;
  this.properties = {};
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
