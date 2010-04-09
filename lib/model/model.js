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
    var err = null;
    var validatedVal = null;
    if (attr.opts.required && !val) {
      err = 'Field "' + attr.name + '" is required.';
    }
    if (!err) {
      validatedVal = val;
    }
    return {
      err: err,
      val: validatedVal
    }
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

for (var p in model) { this[p] = model[p]; }

