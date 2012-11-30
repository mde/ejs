(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            dirname = (dirname == ".") ? filename : dirname ;
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/node_modules/model/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/index.js"}
});

require.define("/node_modules/model/lib/index.js",function(require,module,exports,__dirname,__filename,process,global){/*
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

User = model.register('User', User);
*/

var model = {}
  , EventEmitter = require('events').EventEmitter
  , utils = require('utilities')
  , adapters = require('./adapters')
  , query; // Lazy-load query; it depends on model/index

utils.mixin(model, new (function () {

  this.ModelBase = function () {};
  this.adapters = {};
  this.loadedAdapters = {};
  this.descriptionRegistry = {};
  this.useTimestamps = true;
  this.useUTC = true;
  this.forceCamel = true;

  this.datatypes = null // Lazy-load query; it depends on model/index
  this.validators = require('./validators');
  this.formatters = require('./formatters');

  var _createModelItemConstructor = function (def) {
    // Base constructor function for all model items
    var ModelItemConstructor = function (params) {
      var self = this
        , associations = model.descriptionRegistry[def.name].associations
        , assnKey;

      var _saveAssociations = function (callback) {
            var self = this
              , assn
              , unsaved = this._unsavedAssociations || []
              , doIt = function () {
                  if ((assn = unsaved.shift())) {
                    assn.save(function (err, data) {
                      if (err) {
                        throw err;
                      }
                      doIt();
                    });
                  }
                  else {
                    callback();
                  }
                };

            doIt();
          };

      this.type = def.name;
      // Items fetched from an API should have this flag set to true
      this._saved = params._saved || false;

      // If fetched and instantiated from an API-call, give the
      // instance the appropriate ID -- newly created objects won't
      // have one until saved
      if (params.id) {
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
          , m = model[this.type];
        args.unshift(this);
        _saveAssociations.apply(this, [function () {
          m.save.apply(m, args);
        }]);
      };

      /**
        @name ModelBase#updateProperties
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
      this.updateProperties = function (params, opts) {
        model.updateItem(this, params, opts || {});
      };
      // TODO: Deprecate?
      this.updateAttributes = this.updateProperties;
      /**
        @name ModelBase#toData
        @public
        @function
        @description Returns an object with just the data properties
        defined by its model
       */
      this.toData = function (options) {
        var self = this
          , opts = options || {}
          , whitelist = opts.whitelist || []
          , obj = {}
          , reg = model.descriptionRegistry[this.type]
          , properties = reg.properties;

        for (var p in properties) {
          obj[p] = this[p];
        }
        whitelist.forEach(function (p) {
          if (self[p]) {
            obj[p] = self[p];
          }
        });

        return obj;
      };

      this.toObj = this.toData;

      this.toString = function () {
        var obj = {}
          , props = this.properties
          , formatter;

        obj.id = this.id;
        obj.type = this.type;

        for (var p in props) {
          formatter = model.formatters[props[p].datatype];
          obj[p] = typeof formatter == 'function' ?
              formatter(this[p]) : this[p];
        }

        return JSON.stringify(obj);
      };

      this.toJson = this.toString;

      this.getAssociation = function () {
        var args = Array.prototype.slice.call(arguments)
          , modelName = args.shift()
          , assnType = args.shift()
          , callback = args.pop()
          , query
          , opts
          , otherKeyName = utils.string.decapitalize(modelName)
          , selfKeyName = utils.string.decapitalize(this.type)
          , queryName;

        // Has query object
        if (assnType == 'hasMany') {
          query = args.shift() || {};
        }
        // No query object, create one
        else {
          query = {};
        }
        // Lastly grab opts if any
        opts = args.shift() || {};

        // I belong to the other model; look for the item
        // whose id matches my foreign key for that model
        if (assnType == 'belongsTo') {
          query.id = this[otherKeyName +  'Id'];
        }
        // The other model belongs to me; look for any
        // items whose foreign keys match my id
        // (hasOne is just a special case of hasMany)
        else {
          query[selfKeyName + 'Id'] = this.id;
        }

        queryName = assnType == 'hasMany' ? 'all' : 'load'
        model[modelName][queryName](query, opts, callback);
      };

      this.createAssociation = function () {
        var args = Array.prototype.slice.call(arguments)
          , modelName = args.shift()
          , assnType = args.shift()
          , data = args.shift()
          , otherKeyName = utils.string.decapitalize(modelName)
          , selfKeyName = utils.string.decapitalize(this.type)
          , unsaved;

        if (assnType == 'belongsTo') {
          if (!(data._saved && data.id)) {
            throw new Error('Item cannot have a belongTo association ' +
                'if the item it belongs to is not yet saved.');
          }
          this[otherKeyName + 'Id'] = data.id;
          unsaved = data._unsavedAssociations || [];
          unsaved.push(this);
          data._unsavedAssociations = unsaved;
        }
        else {
          if (!(this._saved && this.id)) {
            throw new Error('Item cannot have a hasOne/hasMany association ' +
                'if it is not yet saved..');
          }
          data[selfKeyName + 'Id'] = this.id;
          unsaved = this._unsavedAssociations || [];
          unsaved.push(data);
          this._unsavedAssociations = unsaved;
        }
      };

      // Relation intstance-methods
      assnKey = associations.hasMany;
      ['hasMany', 'hasOne', 'belongsTo'].forEach(function (k) {
        var assnKeys
          , assnKey
          , modelName
          , keyForCreate = k == 'hasMany' ? 'add' : 'set'
          , createMethod = function (type, keyName, assnType) {
              return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(assnType);
                args.unshift(keyName);
                self[type + 'Association'].apply(self, args);
              };
            };
        if ((assnKeys = associations[k])) {
          for (assnKey in assnKeys) {
            modelName = k == 'hasMany' ?
                utils.inflection.singularize(assnKey) : assnKey;
            // this.getBooks({}, {}, function () {}); =>
            // this.getAssociation('Book', 'hasMany', {}, {}, function () {});
            self['get' + assnKey] = createMethod('get', modelName, k);
            // this.addBook(book); =>
            // this.createAssociation('Book', 'hasMany', book);
            self[keyForCreate + modelName] = createMethod('create', modelName, k);
          }
        }
      });

    };

    return ModelItemConstructor;
  };

  var _createStaticMethodsMixin = function (name) {
    var obj = {};

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

    // Returns the first item found
    obj.first = function () {
      var args = Array.prototype.slice.call(arguments)
        , callback = args.pop()
        , query = args.shift() || {}
        , opts = args.shift() || {};

      if (typeof query == 'string' || typeof query == 'number') {
        query = {id: query};
      }
      opts.limit = 1;

      return obj.all(query, opts, callback);
    };

    // TODO: Deprecate
    obj.load = obj.first;

    obj.all = function () {
      var args = Array.prototype.slice.call(arguments)
        , Query = Query || require('./query/query').Query
        , callback = args.pop() || function () {}
        , query = args.shift() || {}
        , opts = args.shift() || {}
        , adapt;

      query = new Query(model[name], query, opts);

      adapt = model.adapters[name];
      if (!adapt) {
        throw new Error('Adapter not found for ' + name);
      }
      return adapt.load.apply(adapt, [query, callback]);
    };

    obj.save = function () {
      var args = Array.prototype.slice.call(arguments)
        , beforeSaveArgs = args.slice()
        , emitFunc = function () {
            model[name].emit.apply(model[name], beforeSaveArgs);
          }
        , data = args.shift()
        , callback = args.pop() || function () {}
        , opts = args.shift() || {}
        , adapt
        , saved
        , isCollection;

      beforeSaveArgs.unshift('beforeSave');

      adapt = model.adapters[name];
      if (!adapt) {
        throw new Error('Adapter not found for ' + name);
      }

      isCollection = Array.isArray(data);
      // Collection
      // Bulk save only works on new items -- existing item should only
      // be when doing instance.save because update takes only one set
      // of edited props to be applied to all items
      if (isCollection) {

        emitFunc();

        saved = false;
        for (var i = 0, ii = data.length; i < ii; i++) {
          item = data[i];
          if (item._saved) {
            return callback(new Error('A bulk-save can only have new ' +
                'items in it.'), null);
          }
          // Bail out if any instance isn't valid and no force flag
          if (!(item.isValid() || opts.force)) {
            return callback(item.errors, null);
          }
        }
      }
      // Single item
      else {

        saved = data._saved;
        // Bail out if instance isn't valid
        if (!(data.isValid() || opts.force)) {
          return callback(data.errors, null);
        }
        // Already existing instance, use update
        if (saved) {
          if (model.useTimestamps) {
            data.updatedAt = new Date();
          }
          // Re-route to update
          return obj.update.apply(obj, [data, {id: data.id},
              opts, callback]);
        }

        data.emit('beforeSave');
        emitFunc();
      }

      return adapt.insert.apply(adapt, [data, opts, function (err, res) {
        if (!err) {
          model[name].emit('save', res);
          if (!isCollection) {
            data.emit('save');
          }
        }
        callback(err, res);
      }]);
    };

    obj.update = function () {
      var args = Array.prototype.slice.call(arguments)
        , Query = Query || require('./query/query').Query
        , data
        , callback
        , query
        , opts
        , adapt;

      args.unshift('beforeUpdate');
      model[name].emit.apply(model[name], args);
      args.shift();

      data = args.shift();
      callback = args.pop() || function () {};
      query = args.shift() || {};
      opts = args.shift() || {};

      if (typeof query == 'string' || typeof query == 'number') {
        query = {id: query};
      }

      // Data may by just a bag or params, or an actual instance
      if (data instanceof model.ModelBase) {
        // Bail out if instance isn't valid
        if (!(data.isValid() || opts.force)) {
          return callback(data.errors, null);
        }
        data.emit('beforeUpdate');
      }

      query = new Query(model[name], query, opts);

      adapt = model.adapters[name];
      if (!adapt) {
        throw new Error('Adapter not found for ' + name);
      }

      return adapt.update.apply(adapt, [data, query, function (err, res) {
        if (!err) {
          model[name].emit('update', res);
          // Data may by just a bag or params, or an actual instance
          if (typeof data.emit == 'function') {
            data.emit('update');
          }
        }
        callback(err, res);
      }]);
    };

    obj.remove = function () {
      var args = Array.prototype.slice.call(arguments)
        , Query = Query || require('./query/query').Query
        , query
        , callback
        , opts
        , adapt;

      args.unshift('beforeRemove');
      model[name].emit.apply(model[name], args);
      args.shift();

      query = args.shift();
      callback = args.pop() || function () {};
      opts = args.shift() || {};

      if (typeof query == 'string' || typeof query == 'number') {
        query = {id: query};
        opts.limit = 1;
      }

      query = new Query(model[name], query, opts);

      adapt = model.adapters[name];
      if (!adapt) {
        throw new Error('Adapter not found for ' + name);
      }

      return adapt.remove.apply(adapt, [query, function (err, res) {
        if (!err) {
          model[name].emit('remove', res);
        }
        callback(err, res);
      }]);
    };

    obj.modelName = name;

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
    // Mix on the statics
    utils.mixin(defined, ModelDefinition);
    // Same with statics
    utils.mixin(ModelCtor, defined);
    // Same with EventEmitter methods
    utils.enhance(ModelCtor, new EventEmitter());

    // Mix any functions defined directly in the model-item definition
    // 'constructor' into the original prototype, and set it as the prototype of the
    // actual constructor
    utils.mixin(origProto, defined);

    ModelCtor.prototype = new model.ModelBase();
    // Add eventing to instances
    utils.enhance(ModelCtor.prototype, new EventEmitter());
    // Preserve any inherited shit from the definition proto
    utils.enhance(ModelCtor.prototype, origProto);

    model[name] = ModelCtor;

    return ModelCtor;
  };

  this.createItem = function (name, p, o) {
    var params = p || {}
      , opts = o || {}
      , item = new model[name](params);

    model[name].emit('beforeCreate', p, o);

    item = this.validateAndUpdateFromParams(item, params, opts);

    if (this.useTimestamps && !item.createdAt) {
      item.createdAt = new Date();
    }

    // After-create hook
    if (typeof item.afterCreate === 'function') {
      item.afterCreate();
    }
    model[name].emit('create', item);
    return item;
  };

  this.updateItem = function (item, params, opts) {
    var data = {}
      , name = item.type;

    model[name].emit('beforeUpdateProperties', item, params, opts);
    item.emit('beforeUpdateProperties');

    utils.mixin(data, item);
    utils.mixin(data, params);
    this.validateAndUpdateFromParams(item, data, opts);

    // After-update hook
    if (typeof item.afterUpdate === 'function') {
      item.afterUpdate();
    }

    model[name].emit('updateProperties', item);
    item.emit('updateProperties');

    return item;
  };

  this.validateAndUpdateFromParams = function (item, passedParams, opts) {
    var params
      , name = item.type
      , type = model.descriptionRegistry[name]
      , properties = type.properties
      , validated = null
      , errs = null
      , camelizedKey
      , skip = opts.skip
      , skipKeys = {}
      , val;

    item.emit('beforeValidate')
    model[name].emit('beforeValidate', item, passedParams);

    // May be revalidating, clear errors
    delete item.errors;

    // Convert snake_case names in params to camelCase
    if (this.forceCamel) {
      params = {};
      for (var p in passedParams) {
        // Allow leading underscores in the keys for pseudo-privates
        camelizedKey = utils.string.camelize(p, {leadingUnderscore: true});
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

    if (skip) {
      for (var i in skip) {
        skipKeys[skip[i]] = true;
      }
    }

    for (var p in properties) {
      if (skipKeys[p]) {
        continue;
      }

      validated = this.validateProperty(properties[p], params);
      // If there are any failed validations, the errs param
      // contains an Object literal keyed by field name, and the
      // error message for the first failed validation for that
      // property
      // Use raw, invalid value on the instance
      if (validated.err) {
        errs = errs || {};
        errs[p] = validated.err;
        item[p] = params[p];
      }
      // Otherwise add the type-coerced, valid value to the return item
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

    item.emit('validate')
    model[name].emit('validate', item);

    return item;
  };

  this.validateProperty = function (prop, params, opts) {

    this.datatypes = this.datatypes || require('./datatypes');

    var options = opts || {}
      , name = prop.name
      , val = params[name]
      , datatypeName = prop.datatype.toLowerCase()
      , datatypeValidator = this.datatypes[datatypeName].validate
      , result
      , locale = options.locale || utils.i18n.getDefaultLocale();

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
        result = datatypeValidator(name, val, locale);
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

  this.getAdapterInfo = function (name) {
    return adapters.getAdapterInfo(name);
  };

})());

model.ModelDefinitionBase = function (name) {
  var self = this
    , reg = model.descriptionRegistry
    , _createValidator = function (p) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(p);
          return self.validates.apply(self, args);
        };
      };

  this.name = name;

  this.adapter = function (adapter, config) {
      var Adapter = require('./adapters/' + adapters.getAdapterInfo(adapter).filePath).Adapter;
      model.adapters[name] = new Adapter(config);
  };

  this.property = function (name, datatype, o) {
    reg[this.name].properties[name] =
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
    reg[this.name].properties[name]
        .validations[condition] = rule;
  };

  // For each of the validators, create a validatesFooBar from
  // validates('fooBar' ...
  for (var p in model.validators) {
    this['validates' + utils.string.capitalize(p)] = _createValidator(p);
  }

  // Add the base model properties -- these should not be handled by user input
  if (model.useTimestamps) {
    this.property('createdAt', 'datetime');
    this.property('updatedAt', 'datetime');
  }

  ['hasMany', 'hasOne', 'belongsTo'].forEach(function (assnKey) {
    self[assnKey] = function (name) {
      var assn = reg[self.name].associations[assnKey] || {}
        , def
        , idDatatype;
      assn[name] = true;
      reg[self.name].associations[assnKey] = assn;
      if (assnKey == 'belongsTo') {
        // FIXME: Hack, let other models get defined first
        // Should probably listen for an event that signals
        // base models are set up
        setTimeout(function () {
          def = model[name];
          idDatatype = def.autoIncrementId ? 'int' : 'string';
          self.property(utils.string.decapitalize(name) + 'Id', idDatatype);
        }, 0);
      }
    };
  });
};

model.ModelDescription = function (name) {
  this.name = name;
  this.properties = {};
  this.associations = {};
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


});

require.define("events",function(require,module,exports,__dirname,__filename,process,global){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/utilities/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/index.js"}
});

require.define("/node_modules/utilities/lib/index.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var utils = {}
// Core methods
  , core = require('./core')
// Namespaces with methods
  , string = require('./string')
  , file = require('./file')
  , async = require('./async')
  , i18n = require('./i18n')
  , uri = require('./uri')
  , array = require('./array')
  , object = require('./object')
  , date = require('./date')
  , request = require('./request')
  , log = require('./log')
  , network = require('./network')
// Third-party -- remove this if possible
  , inflection = require('./inflection')
// Constructors
  , EventBuffer = require('./event_buffer').EventBuffer
  , XML = require('./xml').XML
  , SortedCollection = require('./sorted_collection').SortedCollection;

core.mixin(utils, core);

utils.string = string;
utils.file = file;
utils.async = async;
utils.i18n = i18n;
utils.uri = uri;
utils.array = array;
utils.object = object;
utils.date = date;
utils.request = request;
utils.log = log;
utils.network = network;
utils.inflection = inflection;
utils.SortedCollection = SortedCollection;
utils.EventBuffer = EventBuffer;
utils.XML = XML;

module.exports = utils;


});

require.define("/node_modules/utilities/lib/core.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

var core = new (function () {

  var _mix = function (targ, src, merge, includeProto) {
    for (var p in src) {
      // Don't copy stuff from the prototype
      if (src.hasOwnProperty(p) || includeProto) {
        if (merge &&
            // Assumes the source property is an Object you can
            // actually recurse down into
            (typeof src[p] == 'object') &&
            (src[p] !== null) &&
            !(src[p] instanceof Array)) {
          // Create the source property if it doesn't exist
          // TODO: What if it's something weird like a String or Number?
          if (typeof targ[p] == 'undefined') {
            targ[p] = {};
          }
          _mix(targ[p], src[p], merge, includeProto); // Recurse
        }
        // If it's not a merge-copy, just set and forget
        else {
          targ[p] = src[p];
        }
      }
    }
  };

  this.objectToString = function (object) {
    var objectArray = []
      , val;

    for (var key in object) {
      val = object[key];

      if (typeof val === 'object') {
        objectArray.push(this.objectToString(val));
      } else {
        objectArray.push(key + '=' + val);
      }
    }
    return objectArray.join(', ');
  };

  /*
   * Mix in the properties on an object to another object
   * yam.mixin(target, source, [source,] [source, etc.] [merge-flag]);
   * 'merge' recurses, to merge object sub-properties together instead
   * of just overwriting with the source object.
   */
  this.mixin = function () {
    var args = Array.prototype.slice.apply(arguments),
        merge = false,
        targ, sources;
    if (args.length > 2) {
      if (typeof args[args.length - 1] == 'boolean') {
        merge = args.pop();
      }
    }
    targ = args.shift();
    sources = args;
    for (var i = 0, ii = sources.length; i < ii; i++) {
      _mix(targ, sources[i], merge);
    }
    return targ;
  };

  this.enhance = function () {
    var args = Array.prototype.slice.apply(arguments),
        merge = false,
        targ, sources;
    if (args.length > 2) {
      if (typeof args[args.length - 1] == 'boolean') {
        merge = args.pop();
      }
    }
    targ = args.shift();
    sources = args;
    for (var i = 0, ii = sources.length; i < ii; i++) {
      _mix(targ, sources[i], merge, true);
    }
    return targ;
  };

})();

module.exports = core;

});

require.define("/node_modules/utilities/lib/string.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var core = require('./core')
  , inflection = require('./inflection')
  , string;


/**
  @name string
  @namespace string
*/

string = new (function () {

  // Regexes for trimming, and character maps for escaping
  var _LTR = /^\s+/
    , _RTR = /\s+$/
    , _TR = /^\s+|\s+$/g
    , _NL = /\n|\r|\r\n/g
    , _CHARS = {
          '&': '&amp;'
        , '<': '&lt;'
        , '>': '&gt;'
        , '"': '&quot;'
        , '\'': '&#39;'
      }
    , _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    , _buildEscape
    , _buildEscapeTest;

  // Builds the escape/unescape methods using a
  // map of characters
  _buildEscape = function (direction) {
    return function (str) {
      var string = str;

      // If string is NaN, null or undefined then provide an empty default
      if((typeof string === 'undefined') ||
          string === null ||
          (!string && isNaN(string))) {
        string = '';
      }
      string = string.toString();

      var from, to, p;
      for (p in _CHARS) {
        from = direction == 'to' ? p : _CHARS[p];
        to = direction == 'to' ? _CHARS[p] : p;

        string = string.replace(new RegExp(from, 'gm'), to);
      }

      return string;
    }
  };

  // Builds a method that tests for any escapable
  // characters, useful for avoiding double-scaping if
  // you're not sure if a string has already been escaped
  _buildEscapeTest = function (direction) {
    return function (string) {
      var pat = ''
        , p;

      for (p in _CHARS) {
        pat += direction == 'to' ? p : _CHARS[p];
        pat += '|';
      }

      pat = pat.substr(0, pat.length - 1);
      pat = new RegExp(pat, "gm");
      return pat.test(string)
    }
  };

  // Escape special XMl chars
  this.escapeXML = _buildEscape('to');

  // Unescape XML chars to literal representation
  this.unescapeXML = _buildEscape('from');

  // Test if a string includes special chars
  // that need escaping
  this.needsEscape = _buildEscapeTest('to');

  // Test if a string includes escaped chars
  // that need unescaping
  this.needsUnescape = _buildEscapeTest('from');

  /**
    @name string#escapeRegExpChars
    @public
    @function
    @return {String} A string of escaped characters
    @description Escapes regex control-characters in strings
    used to build regexes dynamically
    @param {String} string The string of chars to escape
  */
  this.escapeRegExpChars = (function () {
    var specials = [ '^', '$', '/', '.', '*', '+', '?', '|', '(', ')',
        '[', ']', '{', '}', '\\' ];
    sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return function (string) {
      var str = string || '';
      str = String(str);
      return str.replace(sRE, '\\$1');
    };
  }).call(this);

  /**
    @name string#toArray
    @public
    @function
    @return {Array} Returns an array of characters
    @description Converts a string to an array
    @param {String} string The string to convert
  */
  this.toArray = function (string) {
    var str = string || ''
      , arr = []
      , i = -1;
    str = String(str);

    while (++i < str.length) {
      arr.push(str.substr(i, 1));
    }

    return arr;
  };

  /**
    @name string#reverse
    @public
    @function
    @return {String} Returns the `string` reversed
    @description Reverses a string
    @param {String} string The string to reverse
  */
  this.reverse = function (string) {
    var str = string || '';
    str = String(str);
    return this.toArray(str).reverse().join('');
  };

  /**
    @name string#ltrim
    @public
    @function
    @return {String} Returns the trimmed string
    @description Ltrim trims `char` from the left of a `string` and returns it
                 if no `char` is given it will trim spaces
    @param {String} string The string to trim
    @param {String} char The character to trim
  */
  this.ltrim = function (string, char) {
    var str = string || ''
      , pat = char ? new RegExp('^' + char + '+') : _LTR;
    str = String(str);

    return str.replace(pat, '');
  };

  /**
    @name string#rtrim
    @public
    @function
    @return {String} Returns the trimmed string
    @description Rtrim trims `char` from the right of a `string` and returns it
                 if no `char` is given it will trim spaces
    @param {String} string The string to trim
    @param {String} char The character to trim
  */
  this.rtrim = function (string, char) {
    var str = string || ''
      , pat = char ? new RegExp(char + '+$') : _RTR;
    str = String(str);

    return str.replace(pat, '');
  };

  // Alias
  this.chomp = this.rtrim;

  /**
    @name string#trim
    @public
    @function
    @return {String} Returns the trimmed string
    @description Trim trims `char` from the left and right of a `string` and returns it
                 if no `char` is given it will trim spaces
    @param {String} string The string to trim
    @param {String} char The character to trim
  */
  this.trim = function (string, char) {
    var str = string || ''
      , pat = char ? new RegExp('^' + char + '+|' + char + '+$', 'g') : _TR;
    str = String(str);

    return str.replace(pat, '');
  };

  /**
    @name string#chop
    @public
    @function
    @description Returns a new String with the last character removed. If the
    string ends with \r\n, both characters are removed. Applying chop to an
    empty string returns an empty string.
    @param {String} string to return with the last character removed.
  */
  this.chop = function (string) {
    var index
      , str = string || '';
    str = String(str);

    if (str.length) {
      // Special-case for \r\n
      index = str.indexOf('\r\n');
      if (index == str.length - 2) {
        return str.substring(0, index);
      }
      return str.substring(0, str.length - 1);
    }
    else {
      return '';
    }
  };

  /**
    @name string#lpad
    @public
    @function
    @return {String} Returns the padded string
    @description Lpad adds `char` to the left of `string` until the length
                 of `string` is more than `width`
    @param {String} string The string to pad
    @param {String} char The character to pad with
    @param {Number} width the width to pad to
  */
  this.lpad = function (string, char, width) {
    var str = string || ''
      , width;
    str = String(str);

    // Should width be string.length + 1? or the same to be safe
    width = parseInt(width, 10) || str.length;
    char = char || ' ';

    while (str.length < width) {
      str = char + str;
    }
    return str;
  };

  /**
    @name string#rpad
    @public
    @function
    @return {String} Returns the padded string
    @description Rpad adds `char` to the right of `string` until the length
                 of `string` is more than `width`
    @param {String} string The string to pad
    @param {String} char The character to pad with
    @param {Number} width the width to pad to
  */
  this.rpad = function (string, char, width) {
    var str = string || ''
      , width;
    str = String(str);

    // Should width be string.length + 1? or the same to be safe
    width = parseInt(width, 10) || str.length;
    char = char || ' ';

    while (str.length < width) {
      str += char;
    }
    return str;
  };

  /**
    @name string#pad
    @public
    @function
    @return {String} Returns the padded string
    @description Pad adds `char` to the left and right of `string` until the length
                 of `string` is more than `width`
    @param {String} string The string to pad
    @param {String} char The character to pad with
    @param {Number} width the width to pad to
  */
  this.pad = function (string, char, width) {
    var str = string || ''
      , width;
    str = String(str);

    // Should width be string.length + 1? or the same to be safe
    width = parseInt(width, 10) || str.length;
    char = char || ' ';

    while (str.length < width) {
      str = char + str + char;
    }
    return str;
  };

  /**
    @name string#truncate
    @public
    @function
    @return {String} Returns the truncated string
    @description Truncates a given `string` after a specified `length` if `string` is longer than
                 `length`. The last characters will be replaced with an `omission` for a total length
                 not exceeding `length`. If `callback` is given it will fire if `string` is truncated.
    @param {String} string The string to truncate
    @param {Integer/Object} options Options for truncation, If options is an Integer it will be length
      @param {Integer} [options.length=string.length] Length the output string will be
      @param {Integer} [options.len] Alias for `length`
      @param {String} [options.omission='...'] Replace last characters with an omission
      @param {String} [options.ellipsis='...'] Alias for `omission`
      @param {String/RegExp} [options.seperator] Break the truncated test at the nearest `seperator`
    @param {Function} callback Callback is called only if a truncation is done
  */
  this.truncate = function (string, options, callback) {
    var str = string || ''
      , stringLen
      , opts
      , stringLenWithOmission
      , last
      , ignoreCase
      , multiLine
      , stringToWorkWith
      , lastIndexOf
      , nextStop
      , result
      , returnString;

    str = String(str);
    stringLen = str.length

    // If `options` is a number, assume it's the length and
    // create a options object with length
    if (typeof options === 'number') {
      opts = {
        length: options
      };
    }
    else {
      opts = options || {};
    }

    // Set `opts` defaults
    opts.length = opts.length || stringLen;
    opts.omission = opts.omission || opts.ellipsis || '...';

    stringLenWithOmission = opts.length - opts.omission.length;

    // Set the index to stop at for `string`
    if (opts.seperator) {
      if (opts.seperator instanceof RegExp) {
        // If `seperator` is a regex
        if (opts.seperator.global) {
          opts.seperator = opts.seperator;
        } else {
          ignoreCase = opts.seperator.ignoreCase ? 'i' : ''
          multiLine = opts.seperator.multiLine ? 'm' : '';
          opts.seperator = new RegExp(opts.seperator.source,
              'g' + ignoreCase + multiLine);
        }
        stringToWorkWith = str.substring(0, stringLenWithOmission + 1)
        lastIndexOf = -1
        nextStop = 0

        while ((result = opts.seperator.exec(stringToWorkWith))) {
          lastIndexOf = result.index;
          opts.seperator.lastIndex = ++nextStop;
        }
        last = lastIndexOf;
      }
      else {
        // Seperator is a String
        last = str.lastIndexOf(opts.seperator, stringLenWithOmission);
      }

      // If the above couldn't be found, they'll default to -1 so,
      // we need to just set it as `stringLenWithOmission`
      if (last === -1) {
        last = stringLenWithOmission;
      }
    }
    else {
      last = stringLenWithOmission;
    }

    if (stringLen < opts.length) {
      return str;
    }
    else {
      returnString = str.substring(0, last) + opts.omission;
      returnString += callback ? callback() : '';
      return returnString;
    }
  };

  /**
    @name string#truncateHTML
    @public
    @function
    @return {String} Returns the HTML safe truncated string
    @description Truncates a given `string` inside HTML tags after a specified `length` if string`
                 is longer than `length`. The last characters will be replaced with an `omission`
                 for a total length not exceeding `length`. If `callback` is given it will fire if
                 `string` is truncated. If `once` is true only the first string in the first HTML
                 tags will be truncated leaving the others as they were
    @param {String} string The string to truncate
    @param {Integer/Object} options Options for truncation, If options is an Integer it will be length
                            all Object options are the same as `truncate`
      @param {Boolean} [options.once=false] If true, it will only be truncated once, otherwise the
                                            truncation will loop through all text inside HTML tags
    @param {Function} callback Callback is called only if a truncation is done
  */
  this.truncateHTML = function (string, options, callback) {
    var str = string || ''
      , returnString = ''
      , opts = options;

    str = String(str);

    // If `options` is a number assume it's the length and create a options object with length
    if (typeof opts === 'number') {
      var num = opts;

      opts = {};
      opts.length = num;
    } else opts = opts || {};

    // Set `default` options for HTML specifics
    opts.once = opts.once || false;

    var pat = /(<[^>]*>)/ // Patter for matching HTML tags
      , arr = [] // Holds the HTML tags and content seperately
      , truncated = false
      , result = pat.exec(str)
      , item
      , firstPos
      , lastPos
      , i;

    // Gather the HTML tags and content into the array
    while (result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if (firstPos !== 0) {
        // Should be content not HTML tags
        arr.push(str.substring(0, firstPos));
        // Slice content from string
        str = str.slice(firstPos);
      }

      arr.push(result[0]); // Push HTML tags
      str = str.slice(result[0].length);

      // Re-run the pattern on the new string
      result = pat.exec(str);
    }
    if (str !== '') {
      arr.push(str);
    }

    // Loop through array items appending the tags to the string,
    // - and truncating the text then appending it to content
    i = -1;
    while (++i < arr.length) {
      item = arr[i];
      switch (true) {
        // Closing tag
        case item.indexOf('</') == 0:
          returnString += item;
          openTag = null;
          break;
        // Opening tag
        case item.indexOf('<') == 0:
          returnString += item;
          openTag = item;
          break;
        // Normal text
        default:
          if (opts.once && truncated) {
            returnString += item;
          } else {
            returnString += this.truncate(item, opts, callback);
            truncated = true;
          }
          break;
      }
    }

    return returnString;
  };

  /**
    @name string#nl2br
    @public
    @function
    @return {String} The string with converted newlines chars to br tags
    @description Nl2br returns a string where all newline chars are turned
                 into line break HTML tags
    @param {String} string The string to convert
  */
  this.nl2br = function (string) {
    var str = string || '';
    str = String(str);

    return str.replace(_NL,'<br />');
  };

  /**
    @name string#snakeize
    @public
    @function
    @return {String} The string in a snake_case version
    @description Snakeize converts camelCase and CamelCase strings to snake_case strings
    @param {String} string The string to convert to snake_case
    @param {String} separ='_' The seperator to use
  */
  this.snakeize = (function () {
    // Only create regexes once on initial load
    var repl = /([A-Z]+)/g
      , lead = /^_/g;
    return function (string, separ) {
      var str = string || ''
        , sep = separ || '_'
        , leading = separ ? new RegExp('^' + sep, 'g') : lead;
      str = String(str);
      return str.replace(repl, sep + '$1').toLowerCase().
        replace(leading, '');
    };
  }).call(this);

  // Aliases
  /**
    @name string#underscorize
    @public
    @function
    @return {String} The string in a underscorized version
    @description Underscorize returns the given `string` converting camelCase and snakeCase to underscores
    @param {String} string The string to underscorize
  */
  this.underscorize = this.snakeize;
  this.underscoreize = this.snakeize;
  this.decamelize = this.snakeize;

  /**
    @name string#camelize
    @public
    @function
    @return {String} The string in a camelCase version
    @description Camelize takes a string and optional options and
                 returns a camelCase version of the given `string`
    @param {String} string The string to convert to camelCase
    @param {Object} options
      @param {Boolean} [options.initialCap] If initialCap is true the returned
                                            string will have a capitalized first letter
      @param {Boolean} [options.leadingUnderscore] If leadingUnderscore os true then if
                                                   an underscore exists at the beggining
                                                   of the string, it will stay there.
                                                   Otherwise it'll be removed.
  */
  this.camelize = (function () {
    // Only create regex once on initial load
    var repl = /[-_](\w)/g;
    return function (string, options) {
      var str = string || ''
        , ret
        , config = {
            initialCap: false
          , leadingUnderscore: false
          }
        , opts = options || {};

      str = String(str);

      // Backward-compat
      if (typeof opts == 'boolean') {
        config = {
          initialCap: true
        };
      }
      else {
        core.mixin(config, opts);
      }

      ret = str.replace(repl, function (m, m1) {
        return m1.toUpperCase();
      });

      if (config.leadingUnderscore & str.indexOf('_') === 0) {
        ret = '_' + this.decapitalize(ret);
      }
      // If initialCap is true capitalize it
      ret = config.initialCap ? this.capitalize(ret) : this.decapitalize(ret);

      return ret;
    };
  }).call(this);

  /**
    @name string#decapitalize
    @public
    @function
    @return {String} The string with the first letter decapitalized
    @description Decapitalize returns the given string with the first letter uncapitalized.
    @param {String} string The string to decapitalize
  */
  this.decapitalize = function (string) {
    var str = string || '';
    str = String(str);

    return str.substr(0, 1).toLowerCase() + str.substr(1);
  };

  /**
    @name string#capitalize
    @public
    @function
    @return {String} The string with the first letter capitalized
    @description capitalize returns the given string with the first letter capitalized.
    @param {String} string The string to capitalize
  */
  this.capitalize = function (string) {
    var str = string || '';
    str = String(str);

    return str.substr(0, 1).toUpperCase() + str.substr(1);
  };

  /**
    @name string#dasherize
    @public
    @function
    @return {String} The string in a dashed version
    @description Dasherize returns the given `string` converting camelCase and snakeCase
                 to dashes or replace them with the `replace` character.
    @param {String} string The string to dasherize
    @param {String} replace='-' The character to replace with
  */
  this.dasherize = function (string, replace) {
    var repl = replace || '-'
    return this.snakeize(string, repl);
  };

  /**
    @name string#include
    @public
    @function
    @return {Boolean} Returns true if the string is found in the string to search
    @description Searches for a particular string in another string
    @param {String} searchIn The string to search for the other string in
    @param {String} searchFor The string to search for
  */
  this.include = function (searchIn, searchFor) {
    var str = searchFor;
    if (!str && typeof string != 'string') {
      return false;
    }
    str = String(str);
    return (searchIn.indexOf(str) > -1);
  };

  /*
   * getInflections(name<String>, initialCap<String>)
   *
   * Inflection returns an object that contains different inflections
   * created from the given `name`
  */

  /**
    @name string#getInflections
    @public
    @function
    @return {Object} A Object containing multiple different inflects for the given `name`
    @description Inflection returns an object that contains different inflections
                 created from the given `name`
    @param {String} string The string to create inflections from
    @param {Object} options
      @param {Boolean} [options.initialCap]
  */
  this.getInflections = function (name, options) {
    var opts = options || {}
      , initialCap;

    if (!name) {
      return;
    }

    // Backward-compat
    if (typeof opts == 'boolean') {
      opts = {
        initialCap: true
      };
    }

    initialCap = opts.initialCap;

    var self = this
      , normalizedName = this.snakeize(name)
      , nameSingular = inflection.singularize(normalizedName)
      , namePlural = inflection.pluralize(normalizedName);

    return {
      // For filepaths or URLs
      filename: {
        // neil_peart
        singular: nameSingular
        // neil_pearts
      , plural: namePlural
      }
      // Constructor names
    , constructor: {
        // NeilPeart
        singular: self.camelize(nameSingular, {initialCap: true})
        // NeilPearts
      , plural: self.camelize(namePlural, {initialCap: true})
      }
    , property: {
        // neilPeart
        singular: self.camelize(nameSingular)
        // neilPearts
      , plural: self.camelize(namePlural)
      }
    };
  };

  // From Math.uuid.js, https://github.com/broofa/node-uuid
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function (length, radix) {
    var chars = _UUID_CHARS
      , uuid = []
      , r
      , i;

    radix = radix || chars.length;

    if (length) {
      // Compact form
      i = -1;
      while (++i < length) {
        uuid[i] = chars[0 | Math.random()*radix];
      }
    } else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      i = -1;
      while (++i < 36) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

})();

module.exports = string;


});

require.define("/node_modules/utilities/lib/inflection.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Copyright (c) 2010 George Moschovitis, http://www.gmosx.com
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * A port of the Rails/ActiveSupport Inflector class
 * http://api.rubyonrails.org/classes/ActiveSupport/Inflector.html
*/

/**
  @name inflection
  @namespace inflection
*/

var inflection = new (function () {

  /**
    @name inflection#inflections
    @public
    @object
    @description A list of rules and replacements for different inflection types
  */
  this.inflections = {
      plurals: []
    , singulars: []
    , uncountables: []
  };

  var self = this
    , setInflection
    , setPlural
    , setSingular
    , setUncountable
    , setIrregular;

  // Add a new inflection rule/replacement to the beginning of the array for the
  // inflection type
  setInflection = function (type, rule, replacement) {
    self.inflections[type].unshift([rule, replacement]);
  };

  // Add a new plural inflection rule
  setPlural = function (rule, replacement) {
    setInflection('plurals', rule, replacement);
  };

  // Add a new singular inflection rule
  setSingular = function (rule, replacement) {
    setInflection('singulars', rule, replacement);
  };

  // Add a new irregular word to the inflection list, by a given singular and plural inflection
  setIrregular = function (singular, plural) {
    if (singular.substr(0, 1).toUpperCase() == plural.substr(0, 1).toUpperCase()) {
      setPlural(new RegExp("(" + singular.substr(0, 1) + ")" + singular.substr(1) + "$", "i"),
        '$1' + plural.substr(1));
      setPlural(new RegExp("(" + plural.substr(0, 1) + ")" + plural.substr(1) + "$", "i"),
        '$1' + plural.substr(1));
      setSingular(new RegExp("(" + plural.substr(0, 1) + ")" + plural.substr(1) + "$", "i"),
        '$1' + singular.substr(1));
    } else {
      setPlural(new RegExp(singular.substr(0, 1).toUpperCase() + singular.substr(1) + "$"),
        plural.substr(0, 1).toUpperCase() + plural.substr(1));
      setPlural(new RegExp(singular.substr(0, 1).toLowerCase() + singular.substr(1) + "$"),
        plural.substr(0, 1).toLowerCase() + plural.substr(1));
      setPlural(new RegExp(plural.substr(0, 1).toUpperCase() + plural.substr(1) + "$"),
        plural.substr(0, 1).toUpperCase() + plural.substr(1));
      setPlural(new RegExp(plural.substr(0, 1).toLowerCase() + plural.substr(1) + "$"),
        plural.substr(0, 1).toLowerCase() + plural.substr(1));
      setSingular(new RegExp(plural.substr(0, 1).toUpperCase() + plural.substr(1) + "$"),
        singular.substr(0, 1).toUpperCase() + singular.substr(1));
      setSingular(new RegExp(plural.substr(0, 1).toLowerCase() + plural.substr(1) + "$"),
        singular.substr(0, 1).toLowerCase() + singular.substr(1));
    }
  };

  // Add a new word to the uncountable inflection list
  setUncountable = function (word) {
    self.inflections.uncountables[word] = true;
  };

  // Create inflections
  (function () {
    setPlural(/$/, "s");
    setPlural(/s$/i, "s");
    setPlural(/(ax|test)is$/i, "$1es");
    setPlural(/(octop|vir)us$/i, "$1i");
    setPlural(/(alias|status)$/i, "$1es");
    setPlural(/(bu)s$/i, "$1ses");
    setPlural(/(buffal|tomat)o$/i, "$1oes");
    setPlural(/([ti])um$/i, "$1a");
    setPlural(/sis$/i, "ses");
    setPlural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
    setPlural(/(hive)$/i, "$1s");
    setPlural(/([^aeiouy]|qu)y$/i, "$1ies");
    setPlural(/(x|ch|ss|sh)$/i, "$1es");
    setPlural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
    setPlural(/([m|l])ouse$/i, "$1ice");
    setPlural(/^(ox)$/i, "$1en");
    setPlural(/(quiz)$/i, "$1zes");

    setSingular(/s$/i, "")
		setSingular(/ss$/i, "ss")
    setSingular(/(n)ews$/i, "$1ews")
    setSingular(/([ti])a$/i, "$1um")
    setSingular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis")
    setSingular(/(^analy)ses$/i, "$1sis")
    setSingular(/([^f])ves$/i, "$1fe")
    setSingular(/(hive)s$/i, "$1")
    setSingular(/(tive)s$/i, "$1")
    setSingular(/([lr])ves$/i, "$1f")
    setSingular(/([^aeiouy]|qu)ies$/i, "$1y")
    setSingular(/(s)eries$/i, "$1eries")
    setSingular(/(m)ovies$/i, "$1ovie")
    setSingular(/(x|ch|ss|sh)es$/i, "$1")
    setSingular(/([m|l])ice$/i, "$1ouse")
    setSingular(/(bus)es$/i, "$1")
    setSingular(/(o)es$/i, "$1")
    setSingular(/(shoe)s$/i, "$1")
    setSingular(/(cris|ax|test)es$/i, "$1is")
    setSingular(/(octop|vir)i$/i, "$1us")
    setSingular(/(alias|status)es$/i, "$1")
    setSingular(/^(ox)en/i, "$1")
    setSingular(/(vert|ind)ices$/i, "$1ex")
    setSingular(/(matr)ices$/i, "$1ix")
    setSingular(/(quiz)zes$/i, "$1")
    setSingular(/(database)s$/i, "$1")

    setIrregular("person", "people");
    setIrregular("man", "men");
    setIrregular("child", "children");
    setIrregular("sex", "sexes");
    setIrregular("move", "moves");
    setIrregular("cow", "kine");

    setUncountable("equipment");
    setUncountable("information");
    setUncountable("rice");
    setUncountable("money");
    setUncountable("species");
    setUncountable("series");
    setUncountable("fish");
    setUncountable("sheep");
    setUncountable("jeans");
  })();

  /**
    @name inflection#parse
    @public
    @function
    @return {String} The inflection of the word from the type given
    @description Parse a word from the given inflection type
    @param {String} type A type of the inflection to use
    @param {String} word the word to parse
  */
  this.parse = function (type, word) {
    var lowWord = word.toLowerCase()
      , inflections = this.inflections[type];

    if (this.inflections.uncountables[lowWord]) {
      return word;
    }

    var i = -1;
    while (++i < inflections.length) {
      var rule = inflections[i][0]
        , replacement = inflections[i][1];

      if (rule.test(word)) {
        return word.replace(rule, replacement)
      }
    }

    return word;
  };

  /**
    @name inflection#pluralize
    @public
    @function
    @return {String} The plural inflection for the given word
    @description Create a plural inflection for a word
    @param {String} word the word to create a plural version for
  */
  this.pluralize = function (word) {
    return this.parse('plurals', word);
  };

  /**
    @name inflection#singularize
    @public
    @function
    @return {String} The singular inflection for the given word
    @description Create a singular inflection for a word
    @param {String} word the word to create a singular version for
  */
  this.singularize = function (word) {
    return this.parse('singulars', word);
  };

})();

module.exports = inflection;

});

require.define("/node_modules/utilities/lib/file.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

var fs = require('fs')
  , path = require('path')
  , JS_PAT = /\.(js|coffee)$/
  , logger;

var logger = new (function () {
  var out;
  try {
    out = require('./logger');
  }
  catch (e) {
    out = console;
  }

  this.log = function (o) {
    out.log(o);
  };
})();

/**
  @name file
  @namespace file
*/

var fileUtils = new (function () {
  var _copyFile
    , _copyDir
    , _readDir
    , _rmDir
    , _watch;


  // Recursively copy files and directories
  _copyFile = function (fromPath, toPath, opts) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , options = opts || {}
      , fromStat
      , toStat
      , destExists
      , destDoesNotExistErr
      , content
      , filename
      , dirContents
      , targetDir;

    fromStat = fs.statSync(from);

    try {
      //console.dir(to + ' destExists');
      toStat = fs.statSync(to);
      destExists = true;
    }
    catch(e) {
      //console.dir(to + ' does not exist');
      destDoesNotExistErr = e;
      destExists = false;
    }
    // Destination dir or file exists, copy into (directory)
    // or overwrite (file)
    if (destExists) {

      // If there's a rename-via-copy file/dir name passed, use it.
      // Otherwise use the actual file/dir name
      filename = options.rename || path.basename(from);

      // Copying a directory
      if (fromStat.isDirectory()) {
        dirContents = fs.readdirSync(from);
        targetDir = path.join(to, filename);
        // We don't care if the target dir already exists
        try {
          fs.mkdirSync(targetDir, options.mode || 0755);
        }
        catch(e) {
          if (e.code != 'EEXIST') {
            throw e;
          }
        }
        for (var i = 0, ii = dirContents.length; i < ii; i++) {
          //console.log(dirContents[i]);
          _copyFile(path.join(from, dirContents[i]), targetDir);
        }
      }
      // Copying a file
      else {
        content = fs.readFileSync(from);
        // Copy into dir
        if (toStat.isDirectory()) {
          //console.log('copy into dir ' + to);
          fs.writeFileSync(path.join(to, filename), content);
        }
        // Overwrite file
        else {
          //console.log('overwriting ' + to);
          fs.writeFileSync(to, content);
        }
      }
    }
    // Dest doesn't exist, can't create it
    else {
      throw destDoesNotExistErr;
    }
  };

  _copyDir = function (from, to, opts) {
    var createDir = opts.createDir;
  };

  // Return the contents of a given directory
  _readDir = function (dirPath) {
    var dir = path.normalize(dirPath)
      , paths = []
      , ret = [dir];

    try {
      paths = fs.readdirSync(dir);
    }
    catch (e) {
      throw new Error('Could not read path ' + dir);
    }

    paths.forEach(function (p) {
      var curr = path.join(dir, p);
      var stat = fs.statSync(curr);
      if (stat.isDirectory()) {
        ret = ret.concat(_readDir(curr));
      }
      else {
        ret.push(curr);
      }
    });

    return ret;
  };

  // Remove the given directory
  _rmDir = function (dirPath) {
    var dir = path.normalize(dirPath)
      , paths = [];
    paths = fs.readdirSync(dir);
    paths.forEach(function (p) {
      var curr = path.join(dir, p);
      var stat = fs.statSync(curr);
      if (stat.isDirectory()) {
        _rmDir(curr);
      }
      else {
        fs.unlinkSync(curr);
      }
    });
    fs.rmdirSync(dir);
  };

  // Recursively watch files with a callback
  _watch = function (path, callback) {
    fs.stat(path, function (err, stats) {
      if (err) {
        return false;
      }
      if (stats.isFile() && JS_PAT.test(path)) {
        fs.watchFile(path, callback);
      }
      else if (stats.isDirectory()) {
        fs.readdir(path, function (err, files) {
          if (err) {
            return log.fatal(err);
          }
          for (var f in files) {
            _watch(path + '/' + files[f], callback);
          }
        });
      }
    });
  };

  /**
    @name file#cpR
    @public
    @function
    @description Copies a directory/file to a destination
    @param {String} fromPath The source path to copy from
    @param {String} toPath The destination path to copy to
    @param {Object} opts Options to use
      @param {Boolean} [opts.silent] If false then will log the command
  */
  this.cpR = function (fromPath, toPath, options) {
    var from = path.normalize(fromPath)
      , to = path.normalize(toPath)
      , toStat
      , doesNotExistErr
      , paths
      , filename
      , opts = options || {};

    if (!opts.silent) {
      logger.log('cp -r ' + fromPath + ' ' + toPath);
    }

    opts = {}; // Reset

    if (from == to) {
      throw new Error('Cannot copy ' + from + ' to itself.');
    }

    // Handle rename-via-copy
    try {
      toStat = fs.statSync(to);
    }
    catch(e) {
      doesNotExistErr = e;

      // Get abs path so it's possible to check parent dir
      if (!this.isAbsolute(to)) {
        to = path.join(process.cwd() , to);
      }

      // Save the file/dir name
      filename = path.basename(to);
      // See if a parent dir exists, so there's a place to put the
      /// renamed file/dir (resets the destination for the copy)
      to = path.dirname(to);
      try {
        toStat = fs.statSync(to);
      }
      catch(e) {}
      if (toStat && toStat.isDirectory()) {
        // Set the rename opt to pass to the copy func, will be used
        // as the new file/dir name
        opts.rename = filename;
        //console.log('filename ' + filename);
      }
      else {
        throw doesNotExistErr;
      }
    }

    _copyFile(from, to, opts);
  };

  /**
    @name file#mkdirP
    @public
    @function
    @description Create the given directory(ies) using the given mode permissions
    @param {String} dir The directory to create
    @param {Number} mode The mode to give the created directory(ies)(Default: 0755)
  */
  this.mkdirP = function (dir, mode) {
    var dirPath = path.normalize(dir)
      , paths = dirPath.split(/\/|\\/)
      , currPath
      , next;

    if (paths[0] == '' || /^[A-Za-z]+:/.test(paths[0])) {
      currPath = paths.shift() || '/';
      currPath = path.join(currPath, paths.shift());
      //console.log('basedir');
    }
    while ((next = paths.shift())) {
      if (next == '..') {
        currPath = path.join(currPath, next);
        continue;
      }
      currPath = path.join(currPath, next);
      try {
        //console.log('making ' + currPath);
        fs.mkdirSync(currPath, mode || 0755);
      }
      catch(e) {
        if (e.code != 'EEXIST') {
          throw e;
        }
      }
    }
  };

  /**
    @name file#readdirR
    @public
    @function
    @return {Array} Returns the contents as an Array, can be configured via opts.format
    @description Reads the given directory returning it's contents
    @param {String} dir The directory to read
    @param {Object} opts Options to use
      @param {String} [opts.format] Set the format to return(Default: Array)
  */
  this.readdirR = function (dir, opts) {
    var options = opts || {}
      , format = options.format || 'array'
      , ret;
    ret = _readDir(dir);
    return format == 'string' ? ret.join('\n') : ret;
  };

  /**
    @name file#rmRf
    @public
    @function
    @description Deletes the given directory/file
    @param {String} p The path to delete, can be a directory or file
    @param {Object} opts Options to use
      @param {String} [opts.silent] If false then logs the command
  */
  this.rmRf = function (p, options) {
    var stat
      , opts = options || {};
    if (!opts.silent) {
      logger.log('rm -rf ' + p);
    }
    try {
      stat = fs.statSync(p);
      if (stat.isDirectory()) {
        _rmDir(p);
      }
      else {
        fs.unlinkSync(p);
      }
    }
    catch (e) {}
  };

  /**
    @name file#isAbsolute
    @public
    @function
    @return {Boolean/String} If it's absolute the first char is returned otherwise false
    @description Checks if a given path is absolute or relative
    @param {String} p Path to check
  */
  this.isAbsolute = function (p) {
    var match = /^[A-Za-z]+:\\|^\//.exec(p);
    if (match && match.length) {
      return match[0];
    }
    return false;
  };

  /**
    @name file#absolutize
    @public
    @function
    @return {String} Returns the absolute path for the given path
    @description Returns the absolute path for the given path
    @param {String} p The path to get the absolute path for
  */
  this.absolutize = function (p) {
    if (this.isAbsolute(p)) {
      return p;
    }
    else {
      return path.join(process.cwd(), p);
    }
  };

  this.basedir = function (p) {
    var str = p || ''
      , abs = this.isAbsolute(p);
    if (abs) {
      return abs;
    }
    // Split into segments
    str = str.split(/\\|\//)[0];
    // If the path has a leading asterisk, basedir is the current dir
    if (str.indexOf('*') > -1) {
      return '.';
    }
    // Otherwise it's the first segment in the path
    else {
      return str;
    }
  };

  /**
    @name file#searchParentPath
    @public
    @function
    @description Search for a directory/file in the current directory and parent directories
    @param {String} p The path to search for
    @param {Function} callback The function to call once the path is found
  */
  this.searchParentPath = function (location, beginPath, callback) {
    if (typeof beginPath === 'function' && !callback) {
      callback = beginPath;
      beginPath = process.cwd();
    }
    var cwd = beginPath || process.cwd();

    if (!location) {
      // Return if no path is given
      return;
    }
    var relPath = ''
      , i = 5 // Only search up to 5 directories
      , pathLoc
      , pathExists;

    while (--i >= 0) {
      pathLoc = path.join(cwd, relPath, location);
      pathExists = this.existsSync(pathLoc);

      if (pathExists) {
        callback && callback(undefined, pathLoc);
        break;
      } else {
        // Dir could not be found
        if (i === 0) {
          callback && callback(new Error("Path \"" + pathLoc + "\" not found"), undefined);
          break;
        }

        // Add a relative parent directory
        relPath += '../';
        // Switch to relative parent directory
        process.chdir(path.join(cwd, relPath));
      }
    }
  };

  /**
    @name file#watch
    @public
    @function
    @description Watch a given path then calls the callback once a change occurs
    @param {String} path The path to watch
    @param {Function} callback The function to call when a change occurs
  */
  this.watch = function () {
    _watch.apply(this, arguments);
  };

  // Compatibility for fs.exists(0.8) and path.exists(0.6)
  this.exists = (typeof fs.exists === 'function') ? fs.exists : path.exists;

  // Compatibility for fs.existsSync(0.8) and path.existsSync(0.6)
  this.existsSync = (typeof fs.existsSync === 'function') ? fs.existsSync : path.existsSync;

  /**
    @name file#requireLocal
    @public
    @function
    @return {Object} The given module is returned
    @description Require a local module from the node_modules in the current directory
    @param {String} module The module to require
    @param {String} message An option message to throw if the module doesn't exist
  */
  this.requireLocal = function (module, message) {
    // Try to require in the application directory
    try {
      dep = require(path.join(process.cwd(), 'node_modules', module));
    }
    catch(err) {
      if (message) {
        throw new Error(message);
      }
      throw new Error('Module "' + module + '" could not be found as a ' +
          'local module.\n Please make sure there is a node_modules directory in the ' +
          'current directory,\n and install it by doing "npm install ' +
          module + '"');
    }
    return dep;
  };

})();

module.exports = fileUtils;


});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/node_modules/utilities/lib/async.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

var async = {};

/*
AsyncChain -- performs a list of asynchronous calls in a desired order.
Optional "last" method can be set to run after all the items in the
chain have completed.

  // Example usage
  var asyncChain = new async.AsyncChain([
    {
      func: app.trainToBangkok,
      args: [geddy, neil, alex],
      callback: null, // No callback for this action
    },
    {
      func: fs.readdir,
      args: [geddy.config.dirname + '/thailand/express'],
      callback: function (err, result) {
        if (err) {
          // Bail out completely
          arguments.callee.chain.abort();
        }
        else if (result.theBest) {
          // Don't run the next item in the chain; go directly
          // to the 'last' method.
          arguments.callee.chain.shortCircuit();
        }
        else {
          // Otherwise do some other stuff and
          // then go to the next link
        }
      }
    },
    {
      func: child_process.exec,
      args: ['ls ./'],
      callback: this.hitTheStops
    }
  ]);

  // Function to exec after all the links in the chain finish
  asyncChain.last = function () { // Do some final stuff };

  // Start the async-chain
  asyncChain.run();

*/
async.execNonBlocking = function (func) {
  if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
    process.nextTick(func);
  }
  else {
    setTimeout(func, 0);
  }
};

async.AsyncBase = new (function () {

  this.init = function (chain) {
    var item;
    this.chain = [];
    this.currentItem = null;
    this.shortCircuited = false;
    this.shortCircuitedArgs = undefined;
    this.aborted = false;

    for (var i = 0; i < chain.length; i++) {
      item = chain[i];
      this.chain.push(new async.AsyncCall(
          item.func, item.args, item.callback, item.context));
    }
  };

  this.runItem = function (item) {
    // Reference to the current item in the chain -- used
    // to look up the callback to execute with execCallback
    this.currentItem = item;
    // Scopage
    var _this = this;
    // Pass the arguments passed to the current async call
    // to the callback executor, execute it in the correct scope
    var executor = function () {
      _this.execCallback.apply(_this, arguments);
    };
    // Append the callback executor to the end of the arguments
    // Node helpfully always has the callback func last
    var args = item.args.concat(executor);
    var func = item.func;
    // Run the async call
    func.apply(item.context, args);
  };

  this.next = function () {
    if (this.chain.length) {
      this.runItem(this.chain.shift());
    }
    else {
      this.last();
    }
  };

  this.execCallback = function () {
    // Look up the callback, if any, specified for this async call
    var callback = this.currentItem.callback;
    // If there's a callback, do it
    if (callback && typeof callback == 'function') {
      // Allow access to the chain from inside the callback by setting
      // callback.chain = this, and then using arguments.callee.chain
      callback.chain = this;
      callback.apply(this.currentItem.context, arguments);
    }

    this.currentItem.finished = true;

    // If one of the async callbacks called chain.shortCircuit,
    // skip to the 'last' function for the chain
    if (this.shortCircuited) {
      this.last.apply(null, this.shortCircuitedArgs);
    }
    // If one of the async callbacks called chain.abort,
    // bail completely out
    else if (this.aborted) {
      return;
    }
    // Otherwise run the next item, if any, in the chain
    // Let's try not to block if we don't have to
    else {
      // Scopage
      var _this = this;
      async.execNonBlocking(function () { _this.next.call(_this); });
    }
  }

  // Short-circuit the chain, jump straight to the 'last' function
  this.shortCircuit = function () {
    this.shortCircuitedArgs = arguments;
    this.shortCircuited = true;
  }

  // Stop execution of the chain, bail completely out
  this.abort = function () {
    this.aborted = true;
  }

  // Kick off the chain by grabbing the first item and running it
  this.run = this.next;

  // Function to run when the chain is done -- default is a no-op
  this.last = function () {};

})();

async.AsyncChain = function (chain) {
  this.init(chain);
};

async.AsyncChain.prototype = async.AsyncBase;

async.AsyncGroup = function (group) {
  var item;
  var callback;
  var args;

  this.group = [];
  this.outstandingCount = 0;

  for (var i = 0; i < group.length; i++) {
    item = group[i];
    this.group.push(new async.AsyncCall(
        item.func, item.args, item.callback, item.context));
    this.outstandingCount++;
  }

};

/*
Simpler way to group async calls -- doesn't ensure completion order,
but still has a "last" method called when the entire group of calls
have completed.
*/
async.AsyncGroup.prototype = new function () {
  this.run = function () {
    var _this = this
      , group = this.group
      , item
      , createItem = function (item, args) {
          return function () {
            item.func.apply(item.context, args);
          };
        }
      , createCallback = function (item) {
          return function () {
            if (item.callback) {
              item.callback.apply(null, arguments);
            }
            _this.finish.call(_this);
          }
        };

    for (var i = 0; i < group.length; i++) {
      item = group[i];
      callback = createCallback(item);
      args = item.args.concat(callback);
      // Run the async call
      async.execNonBlocking(createItem(item, args));
    }
  };

  this.finish = function () {
    this.outstandingCount--;
    if (!this.outstandingCount) {
      this.last();
    };
  };

  this.last = function () {};

};

var _createSimpleAsyncCall = function (func, context) {
  return {
    func: func
  , args: []
  , callback: function () {}
  , context: context
  };
};

async.SimpleAsyncChain = function (funcs, context) {
  chain = [];
  for (var i = 0, ii = funcs.length; i < ii; i++) {
    chain.push(_createSimpleAsyncCall(funcs[i], context));
  }
  this.init(chain);
};

async.SimpleAsyncChain.prototype = async.AsyncBase;

async.AsyncCall = function (func, args, callback, context) {
  this.func = func;
  this.args = args;
  this.callback = callback || null;
  this.context = context || null;
};

module.exports = async;


});

require.define("/node_modules/utilities/lib/i18n.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var core = require('./core')
  , i18n;

i18n = new (function () {
  var _defaultLocale = 'en-us'
    , _strings = {};

  this.getText = function (key, opts, locale) {
    var currentLocale = locale || _defaultLocale
      , currentLocaleStrings = _strings[currentLocale] || {}
      , defaultLocaleStrings = _strings[_defaultLocale] || {}
      , str = currentLocaleStrings[key]
            || defaultLocaleStrings[key] || "[[" + key + "]]";
    for (p in opts) {
      str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), opts[p]);
    }
    return str;
  };

  this.getDefaultLocale = function (locale) {
    return _defaultLocale;
  };

  this.setDefaultLocale = function (locale) {
    _defaultLocale = locale;
  };

  this.loadLocale = function (locale, strings) {
    _strings[locale] = _strings[locale] || {};
    core.mixin(_strings[locale], strings);
  };

})();

i18n.I18n = function (locale) {
  this.getText = function (key, opts) {
    return i18n.getText(key, opts || {}, locale);
  };
  this.t = this.getText;
};

module.exports = i18n;


});

require.define("/node_modules/utilities/lib/uri.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var uri
  , string = require('./string');

/**
  @name uri
  @namespace uri
*/

uri = new (function () {
  var _isArray = function (obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  /**
    @name uri#getFileExtension
    @public
    @function
    @return {String} Returns the file extension for a given path
    @description Gets the file extension fir a path and returns it
    @param {String} path The path to get the extension for
  */
  this.getFileExtension = function (path) {
    var match;
    if (path) {
      match = /.+\.(\w{2,4}$)/.exec(path);
    }
    return (match && match[1]) || '';
  };

  /**
    @name uri#paramify
    @public
    @function
    @return {String} Returns a querystring contains the given values
    @description Convert a JS Object to a querystring (key=val&key=val). Values in arrays
      will be added as multiple parameters
    @param {Object} obj An Object containing only scalars and arrays
    @param {Object} o The options to use for formatting
      @param {Boolean} [o.consolidate=false] take values from elements that can return
        multiple values (multi-select, checkbox groups) and collapse into a single,
        comman-delimited value.
      @param {Boolean} [o.includeEmpty=false] include keys in the string for all elements, even
        they have no value set (e.g., even if elemB has no value: elemA=foo&elemB=&elemC=bar).
        Note that some false-y values are always valid even without this option, [0, ''].
        This option extends coverage to [null, undefined, NaN]
      @param {Boolean} [o.snakeize=false] change param names from camelCase to snake_case.
      @param {Boolean} [o.escapeVals=false] escape the values for XML entities.
  */
  this.paramify = function (obj, o) {
    var opts = o || {},
        str = '',
        key,
        val,
        isValid,
        itemArray,
        arr = [],
        arrVal;

    for (var p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        val = obj[p];

        // This keeps valid falsy values like false and 0
        // It's duplicated in the array block below. Could
        // put it in a function but don't want the overhead
        isValid = !( val === null || val === undefined ||
                    (typeof val === 'number' && isNaN(val)) );

        key = opts.snakeize ? string.snakeize(p) : p;
        if (isValid) {
          // Multiple vals -- array
          if (_isArray(val) && val.length) {
            itemArray = [];
            for (var i = 0, ii = val.length; i < ii; i++) {
              arrVal = val[i];
              // This keeps valid falsy values like false and 0
              isValid = !( arrVal === null || arrVal === undefined ||
                           (typeof arrVal === 'number' && isNaN(arrVal)) );

              itemArray[i] = isValid ? encodeURIComponent(arrVal) : '';
              if (opts.escapeVals) {
                itemArray[i] = string.escapeXML(itemArray[i]);
              }
            }
            // Consolidation mode -- single value joined on comma
            if (opts.consolidate) {
              arr.push(key + '=' + itemArray.join(','));
            }
            // Normal mode -- multiple, same-named params with each val
            else {
              // {foo: [1, 2, 3]} => 'foo=1&foo=2&foo=3'
              // Add into results array, as this just ends up getting
              // joined on ampersand at the end anyhow
              arr.push(key + '=' + itemArray.join('&' + key + '='));
            }
          }
          // Single val -- string
          else {
            if (opts.escapeVals) {
              val = string.escapeXML(val);
            }
            arr.push(key + '=' + encodeURIComponent(val));
          }
          str += '&';
        }
        else {
          if (opts.includeEmpty) { arr.push(key + '='); }
        }
      }
    }
    return arr.join('&');
  };

  /**
    @name uri#objectify
    @public
    @function
    @return {Object} JavaScript key/val object with the values from the querystring
    @description Convert the values in a query string (key=val&key=val) to an Object
    @param {String} str The querystring to convert to an object
    @param {Object} o The options to use for formatting
      @param {Boolean} [o.consolidate=true] Convert multiple instances of the same
        key into an array of values instead of overwriting
  */
  this.objectify = function (str, o) {
    var opts = o || {};
    var d = {};
    var consolidate = typeof opts.consolidate == 'undefined' ?
        true : opts.consolidate;
    if (str) {
      var arr = str.split('&');
      for (var i = 0; i < arr.length; i++) {
        var pair = arr[i].split('=');
        var name = pair[0];
        var val = decodeURIComponent(pair[1] || '');
        // "We've already got one!" -- arrayize if the flag
        // is set
        if (typeof d[name] != 'undefined' && consolidate) {
          if (typeof d[name] == 'string') {
            d[name] = [d[name]];
          }
          d[name].push(val);
        }
        // Otherwise just set the value
        else {
          d[name] = val;
        }
      }
    }
    return d;
  };

})();

module.exports = uri;


});

require.define("/node_modules/utilities/lib/array.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

/**
  @name array
  @namespace array
*/

var array = new (function () {

  /**
    @name array#humanize
    @public
    @function
    @return {String} A string containing the array elements in a readable format
    @description Creates a string containing the array elements in a readable format
    @param {Array} array The array to humanize
  */
  this.humanize = function (array) {
    // If array only has one item then just return it
    if (array.length <= 1) {
      return String(array);
    }

    var last = array.pop()
      , items = array.join(', ');

    return items + ' and ' + last;
  };

  /**
    @name array#included
    @public
    @function
    @return {Array/Boolean} If `item` is included the `array` is
      returned otherwise false
    @description Checks if an `item` is included in an `array`
    @param {Any} item The item to look for
    @param {Array} array The array to check
  */
  this.included = function (item, array) {
    var result = array.indexOf(item);

    if (result === -1) {
      return false;
    } else {
      return array;
    }
  };

  /**
    @name array#include
    @public
    @function
    @return {Boolean} Return true if the item is included in the array
    @description Checks if an `item` is included in an `array`
    @param {Array} array The array to check
    @param {Any} item The item to look for
  */
  this.include = function (array, item) {
    var res = -1;
    if (typeof array.indexOf == 'function') {
      res = array.indexOf(item);
    }
    else {
      for (var i = 0, ii = array.length; i < ii; i++) {
        if (array[i] == item) {
          res = i;
          break;
        }
      }
    }
    return res > -1;
  };

})();

module.exports = array;

});

require.define("/node_modules/utilities/lib/object.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

/**
  @name object
  @namespace object
*/

var object = new (function () {

  /**
    @name object#merge
    @public
    @function
    @return {Object} Returns the merged object
    @description Merge merges `otherObject` into `object` and takes care of deep
                 merging of objects
    @param {Object} object Object to merge into
    @param {Object} otherObject Object to read from
  */
  this.merge = function (object, otherObject) {
    var obj = object || {}
      , otherObj = otherObject || {}
      , key, value;

    for (key in otherObj) {
      value = otherObj[key];

      // Check if a value is an Object, if so recursively add it's key/values
      if (typeof value === 'object' && !(value instanceof Array)) {
        // Update value of object to the one from otherObj
        obj[key] = this.merge(obj[key], value);
      }
      // Value is anything other than an Object, so just add it
      else {
        obj[key] = value;
      }
    }

    return obj;
  };

  /**
    @name object#reverseMerge
    @public
    @function
    @return {Object} Returns the merged object
    @description ReverseMerge merges `object` into `defaultObject`
    @param {Object} object Object to read from
    @param {Object} defaultObject Object to merge into
  */
  this.reverseMerge = function (object, defaultObject) {
    // Same as `merge` except `defaultObject` is the object being changed
    // - this is useful if we want to easily deal with default object values
    return this.merge(defaultObject, object);
  };

  /**
    @name object#isEmpty
    @public
    @function
    @return {Boolean} Returns true if empty false otherwise
    @description isEmpty checks if an Object is empty
    @param {Object} object Object to check if empty
  */
  this.isEmpty = function (object) {
    // Returns true if a object is empty false if not
    for (var i in object) { return false; }
    return true;
  };

  /**
    @name object#toArray
    @public
    @function
    @return {Array} Returns an array of objects each including the original key and value
    @description Converts an object to an array of objects each including the original key/value
    @param {Object} object Object to convert
  */
  this.toArray = function (object) {
    // Converts an object into an array of objects with the original key, values
    array = [];

    for (var i in object) {
      array.push({ key: i, value: object[i] });
    }

    return array;
  };

})();

module.exports = object;

});

require.define("/node_modules/utilities/lib/date.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

var string = require('./string')
  , date
  , log = require('./log');

/**
  @name date
  @namespace date
*/

date = new (function () {
  var _this = this
    , _date = new Date();

  var _US_DATE_PAT = /^(\d{1,2})(?:\-|\/|\.)(\d{1,2})(?:\-|\/|\.)(\d{4})/;
  var _DATETIME_PAT = /^(\d{4})(?:\-|\/|\.)(\d{1,2})(?:\-|\/|\.)(\d{1,2})(?:T| )?(\d{2})?(?::)?(\d{2})?(?::)?(\d{2})?(?:\.)?(\d+)?(?: *)?(Z|[+-]\d{4}|[+-]\d{2}:\d{2}|[+-]\d{2})?/;
  // TODO Add am/pm parsing instead of dumb, 24-hour clock.
  var _TIME_PAT = /^(\d{1,2})?(?::)?(\d{2})?(?::)?(\d{2})?(?:\.)?(\d+)?$/;

  var _dateMethods = [
      'FullYear'
    , 'Month'
    , 'Date'
    , 'Hours'
    , 'Minutes'
    , 'Seconds'
    , 'Milliseconds'
  ];

  var _isArray = function (obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  this.weekdayLong = ['Sunday', 'Monday', 'Tuesday',
    'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed',
    'Thu', 'Fri', 'Sat'];
  this.monthLong = ['January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];
  this.monthShort = ['Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  this.meridiem = {
    'AM': 'AM',
    'PM': 'PM'
  }
  // compat
  this.meridian = this.meridiem

  /**
    @name date#supportedFormats
    @public
    @object
    @description List of supported strftime formats
  */
  this.supportedFormats = {
    // abbreviated weekday name according to the current locale
    'a': function (dt) { return _this.weekdayShort[dt.getDay()]; },
    // full weekday name according to the current locale
    'A': function (dt) { return _this.weekdayLong[dt.getDay()]; },
    //  abbreviated month name according to the current locale
    'b': function (dt) { return _this.monthShort[dt.getMonth()]; },
    'h': function (dt) { return _this.strftime(dt, '%b'); },
    // full month name according to the current locale
    'B': function (dt) { return _this.monthLong[dt.getMonth()]; },
    // preferred date and time representation for the current locale
    'c': function (dt) { return _this.strftime(dt, '%a %b %d %T %Y'); },
    // century number (the year divided by 100 and truncated
    // to an integer, range 00 to 99)
    'C': function (dt) { return _this.calcCentury(dt.getFullYear());; },
    // day of the month as a decimal number (range 01 to 31)
    'd': function (dt) { return string.lpad(dt.getDate(), '0', 2); },
    // same as %m/%d/%y
    'D': function (dt) { return _this.strftime(dt, '%m/%d/%y') },
    // day of the month as a decimal number, a single digit is
    // preceded by a space (range ' 1' to '31')
    'e': function (dt) { return string.lpad(dt.getDate(), ' ', 2); },
    // month as a decimal number, a single digit is
    // preceded by a space (range ' 1' to '12')
    'f': function () { return _this.strftimeNotImplemented('f'); },
    // same as %Y-%m-%d
    'F': function (dt) { return _this.strftime(dt, '%Y-%m-%d');  },
    // like %G, but without the century.
    'g': function () { return _this.strftimeNotImplemented('g'); },
    // The 4-digit year corresponding to the ISO week number
    // (see %V).  This has the same format and value as %Y,
    // except that if the ISO week number belongs to the
    // previous or next year, that year is used instead.
    'G': function () { return _this.strftimeNotImplemented('G'); },
    // hour as a decimal number using a 24-hour clock (range
    // 00 to 23)
    'H': function (dt) { return string.lpad(dt.getHours(), '0', 2); },
    // hour as a decimal number using a 12-hour clock (range
    // 01 to 12)
    'I': function (dt) { return string.lpad(
      _this.hrMil2Std(dt.getHours()), '0', 2); },
    // day of the year as a decimal number (range 001 to 366)
    'j': function (dt) { return string.lpad(
      _this.calcDays(dt), '0', 3); },
    // Hour as a decimal number using a 24-hour clock (range
    // 0 to 23 (space-padded))
    'k': function (dt) { return string.lpad(dt.getHours(), ' ', 2); },
    // Hour as a decimal number using a 12-hour clock (range
    // 1 to 12 (space-padded))
    'l': function (dt) { return string.lpad(
      _this.hrMil2Std(dt.getHours()), ' ', 2); },
    // month as a decimal number (range 01 to 12)
    'm': function (dt) { return string.lpad((dt.getMonth()+1), '0', 2); },
    // minute as a decimal number
    'M': function (dt) { return string.lpad(dt.getMinutes(), '0', 2); },
    // Linebreak
    'n': function () { return '\n'; },
    // either `am' or `pm' according to the given time value,
    // or the corresponding strings for the current locale
    'p': function (dt) { return _this.getMeridian(dt.getHours()); },
    // time in a.m. and p.m. notation
    'r': function (dt) { return _this.strftime(dt, '%I:%M:%S %p'); },
    // time in 24 hour notation
    'R': function (dt) { return _this.strftime(dt, '%H:%M'); },
    // second as a decimal number
    'S': function (dt) { return string.lpad(dt.getSeconds(), '0', 2); },
    // Tab char
    't': function () { return '\t'; },
    // current time, equal to %H:%M:%S
    'T': function (dt) { return _this.strftime(dt, '%H:%M:%S'); },
    // weekday as a decimal number [1,7], with 1 representing
    // Monday
    'u': function (dt) { return _this.convertOneBase(dt.getDay()); },
    // week number of the current year as a decimal number,
    // starting with the first Sunday as the first day of the
    // first week
    'U': function () { return _this.strftimeNotImplemented('U'); },
    // week number of the year (Monday as the first day of the
    // week) as a decimal number [01,53]. If the week containing
    // 1 January has four or more days in the new year, then it
    // is considered week 1. Otherwise, it is the last week of
    // the previous year, and the next week is week 1.
    'V': function () { return _this.strftimeNotImplemented('V'); },
    // week number of the current year as a decimal number,
    // starting with the first Monday as the first day of the
    // first week
    'W': function () { return _this.strftimeNotImplemented('W'); },
    // day of the week as a decimal, Sunday being 0
    'w': function (dt) { return dt.getDay(); },
    // preferred date representation for the current locale
    // without the time
    'x': function (dt) { return _this.strftime(dt, '%D'); },
    // preferred time representation for the current locale
    // without the date
    'X': function (dt) { return _this.strftime(dt, '%T'); },
    // year as a decimal number without a century (range 00 to
    // 99)
    'y': function (dt) { return _this.getTwoDigitYear(dt.getFullYear()); },
    // year as a decimal number including the century
    'Y': function (dt) { return string.lpad(dt.getFullYear(), '0', 4); },
    // time zone or name or abbreviation
    'z': function () { return _this.strftimeNotImplemented('z'); },
    'Z': function () { return _this.strftimeNotImplemented('Z'); },
    // Literal percent char
    '%': function (dt) { return '%'; }
  };

  /**
    @name date#getSupportedFormats
    @public
    @function
    @description return the list of formats in a string
    @return {String} The list of supported formats
  */
  this.getSupportedFormats = function () {
    var str = '';
    for (var i in this.supportedFormats) { str += i; }
    return str;
  }

  this.supportedFormatsPat = new RegExp('%[' +
      this.getSupportedFormats() + ']{1}', 'g');

  /**
    @name date#strftime
    @public
    @function
    @return {String} The `dt` formated with the given `format`
    @description Formats the given date with the strftime format
    @param {Date} dt the date object to format
    @param {String} format the format to convert the date to
  */
  this.strftime = function (dt, format) {
    if (!dt) { return '' }

    var d = dt;
    var pats = [];
    var dts = [];
    var str = format;

    // Allow either Date obj or UTC stamp
    d = typeof dt == 'number' ? new Date(dt) : dt;

    // Grab all instances of expected formats into array
    while (pats = this.supportedFormatsPat.exec(format)) {
      dts.push(pats[0]);
    }

    // Process any hits
    for (var i = 0; i < dts.length; i++) {
      key = dts[i].replace(/%/, '');
      str = str.replace('%' + key,
        this.supportedFormats[key](d));
    }
    return str;

  };

  this.strftimeNotImplemented = function (s) {
    throw('this.strftime format "' + s + '" not implemented.');
  };

  /**
    @name date#calcCentury
    @public
    @function
    @return {String} The century for the given date
    @description Find the century for the given `year`
    @param {String} year The year to find the century for
  */
  this.calcCentury = function (year) {
    if(!year) {
      year = _date.getFullYear();
    }

    var ret = parseInt((year / 100) + 1);
    year = year.toString();

    // If year ends in 00 subtract one, because it's still the century before the one
    // it divides to
    if (year.substring(year.length - 2) === '00') {
      ret--;
    }

    return ret.toString();
  };

  /**
    @name date#calcDays
    @public
    @function
    @return {Number} The number of days so far for the given date
    @description Calculate the day number in the year a particular date is on
    @param {Date} dt The date to use
  */
  this.calcDays = function (dt) {
    var first = new Date(dt.getFullYear(), 0, 1);
    var diff = 0;
    var ret = 0;
    first = first.getTime();
    diff = (dt.getTime() - first);
    ret = parseInt(((((diff/1000)/60)/60)/24))+1;
    return ret;
  };

  /**
   * Adjust from 0-6 base week to 1-7 base week
   * @param d integer for day of week
   * @return Integer day number for 1-7 base week
   */
  this.convertOneBase = function (d) {
    return d == 0 ? 7 : d;
  };

  this.getTwoDigitYear = function (yr) {
    // Add a millenium to take care of years before the year 1000,
    // (e.g, the year 7) since we're only taking the last two digits
    // If we overshoot, it doesn't matter
    var millenYear = yr + 1000;
    var str = millenYear.toString();
    str = str.substr(2); // Get the last two digits
    return str
  };

  /**
    @name date#getMeridiem
    @public
    @function
    @return {String} Return 'AM' or 'PM' based on hour in 24-hour format
    @description Return 'AM' or 'PM' based on hour in 24-hour format
    @param {Number} h The hour to check
  */
  this.getMeridiem = function (h) {
    return h > 11 ? this.meridiem.PM :
      this.meridiem.AM;
  };
  // Compat
  this.getMeridian = this.getMeridiem;

  /**
    @name date#hrMil2Std
    @public
    @function
    @return {String} Return a 12 hour version of the given time
    @description Convert a 24-hour formatted hour to 12-hour format
    @param {String} hour The hour to convert
  */
  this.hrMil2Std = function (hour) {
    var h = typeof hour == 'number' ? hour : parseInt(hour);
    var str = h > 12 ? h - 12 : h;
    str = str == 0 ? 12 : str;
    return str;
  };

  /**
    @name date#hrStd2Mil
    @public
    @function
    @return {String} Return a 24 hour version of the given time
    @description Convert a 12-hour formatted hour with meridian flag to 24-hour format
    @param {String} hour The hour to convert
    @param {Boolean} If hour is PM then this should be true
  */
  this.hrStd2Mil = function  (hour, pm) {
    var h = typeof hour == 'number' ? hour : parseInt(hour);
    var str = '';
    // PM
    if (pm) {
      str = h < 12 ? (h+12) : h;
    }
    // AM
    else {
      str = h == 12 ? 0 : h;
    }
    return str;
  };

  // Constants for use in this.add
  var dateParts = {
    YEAR: 'year'
    , MONTH: 'month'
    , DAY: 'day'
    , HOUR: 'hour'
    , MINUTE: 'minute'
    , SECOND: 'second'
    , MILLISECOND: 'millisecond'
    , QUARTER: 'quarter'
    , WEEK: 'week'
    , WEEKDAY: 'weekday'
  };
  // Create a map for singular/plural lookup, e.g., day/days
  var datePartsMap = {};
  for (var p in dateParts) {
    datePartsMap[dateParts[p]] = dateParts[p];
    datePartsMap[dateParts[p] + 's'] = dateParts[p];
  }
  this.dateParts = dateParts;

  /**
    @name date#add
    @public
    @function
    @return {Date} Incremented date
    @description Add to a Date in intervals of different size, from
    milliseconds to years
    @param {Date} dt Date (or timestamp Number), date to increment
    @param {String} interv a constant representing the interval,
    e.g. YEAR, MONTH, DAY.  See this.dateParts
    @param {Number} incr how much to add to the date
  */
  this.add = function (dt, interv, incr) {
    if (typeof dt == 'number') { dt = new Date(dt); }
    function fixOvershoot() {
      if (sum.getDate() < dt.getDate()) {
        sum.setDate(0);
      }
    }
    var key = datePartsMap[interv];
    var sum = new Date(dt);
    switch (key) {
      case dateParts.YEAR:
        sum.setFullYear(dt.getFullYear()+incr);
        // Keep increment/decrement from 2/29 out of March
        fixOvershoot();
        break;
      case dateParts.QUARTER:
        // Naive quarter is just three months
        incr*=3;
        // fallthrough...
      case dateParts.MONTH:
        sum.setMonth(dt.getMonth()+incr);
        // Reset to last day of month if you overshoot
        fixOvershoot();
        break;
      case dateParts.WEEK:
        incr*=7;
        // fallthrough...
      case dateParts.DAY:
        sum.setDate(dt.getDate() + incr);
        break;
      case dateParts.WEEKDAY:
        //FIXME: assumes Saturday/Sunday weekend, but even this is not fixed.
        // There are CLDR entries to localize this.
        var dat = dt.getDate();
        var weeks = 0;
        var days = 0;
        var strt = 0;
        var trgt = 0;
        var adj = 0;
        // Divide the increment time span into weekspans plus leftover days
        // e.g., 8 days is one 5-day weekspan / and two leftover days
        // Can't have zero leftover days, so numbers divisible by 5 get
        // a days value of 5, and the remaining days make up the number of weeks
        var mod = incr % 5;
        if (mod == 0) {
          days = (incr > 0) ? 5 : -5;
          weeks = (incr > 0) ? ((incr-5)/5) : ((incr+5)/5);
        }
        else {
          days = mod;
          weeks = parseInt(incr/5);
        }
        // Get weekday value for orig date param
        strt = dt.getDay();
        // Orig date is Sat / positive incrementer
        // Jump over Sun
        if (strt == 6 && incr > 0) {
          adj = 1;
        }
        // Orig date is Sun / negative incrementer
        // Jump back over Sat
        else if (strt == 0 && incr < 0) {
          adj = -1;
        }
        // Get weekday val for the new date
        trgt = strt + days;
        // New date is on Sat or Sun
        if (trgt == 0 || trgt == 6) {
          adj = (incr > 0) ? 2 : -2;
        }
        // Increment by number of weeks plus leftover days plus
        // weekend adjustments
        sum.setDate(dat + (7*weeks) + days + adj);
        break;
      case dateParts.HOUR:
        sum.setHours(sum.getHours()+incr);
        break;
      case dateParts.MINUTE:
        sum.setMinutes(sum.getMinutes()+incr);
        break;
      case dateParts.SECOND:
        sum.setSeconds(sum.getSeconds()+incr);
        break;
      case dateParts.MILLISECOND:
        sum.setMilliseconds(sum.getMilliseconds()+incr);
        break;
      default:
        // Do nothing
        break;
    }
    return sum; // Date
  };

  /**
    @name date#diff
    @public
    @function
    @return {Number} number of (interv) units apart that
    the two dates are
    @description Get the difference in a specific unit of time (e.g., number
    of months, weeks, days, etc.) between two dates.
    @param {Date} date1 First date to check
    @param {Date} date2 Date to compate `date1` with
    @param {String} interv a constant representing the interval,
    e.g. YEAR, MONTH, DAY.  See this.dateParts
  */
  this.diff = function (date1, date2, interv) {
    //  date1
    //    Date object or Number equivalent
    //
    //  date2
    //    Date object or Number equivalent
    //
    //  interval
    //    A constant representing the interval, e.g. YEAR, MONTH, DAY.  See this.dateParts.

    // Accept timestamp input
    if (typeof date1 == 'number') { date1 = new Date(date1); }
    if (typeof date2 == 'number') { date2 = new Date(date2); }
    var yeaDiff = date2.getFullYear() - date1.getFullYear();
    var monDiff = (date2.getMonth() - date1.getMonth()) + (yeaDiff * 12);
    var msDiff = date2.getTime() - date1.getTime(); // Millisecs
    var secDiff = msDiff/1000;
    var minDiff = secDiff/60;
    var houDiff = minDiff/60;
    var dayDiff = houDiff/24;
    var weeDiff = dayDiff/7;
    var delta = 0; // Integer return value

    var key = datePartsMap[interv];
    switch (key) {
      case dateParts.YEAR:
        delta = yeaDiff;
        break;
      case dateParts.QUARTER:
        var m1 = date1.getMonth();
        var m2 = date2.getMonth();
        // Figure out which quarter the months are in
        var q1 = Math.floor(m1/3) + 1;
        var q2 = Math.floor(m2/3) + 1;
        // Add quarters for any year difference between the dates
        q2 += (yeaDiff * 4);
        delta = q2 - q1;
        break;
      case dateParts.MONTH:
        delta = monDiff;
        break;
      case dateParts.WEEK:
        // Truncate instead of rounding
        // Don't use Math.floor -- value may be negative
        delta = parseInt(weeDiff);
        break;
      case dateParts.DAY:
        delta = dayDiff;
        break;
      case dateParts.WEEKDAY:
        var days = Math.round(dayDiff);
        var weeks = parseInt(days/7);
        var mod = days % 7;

        // Even number of weeks
        if (mod == 0) {
          days = weeks*5;
        }
        else {
          // Weeks plus spare change (< 7 days)
          var adj = 0;
          var aDay = date1.getDay();
          var bDay = date2.getDay();

          weeks = parseInt(days/7);
          mod = days % 7;
          // Mark the date advanced by the number of
          // round weeks (may be zero)
          var dtMark = new Date(date1);
          dtMark.setDate(dtMark.getDate()+(weeks*7));
          var dayMark = dtMark.getDay();

          // Spare change days -- 6 or less
          if (dayDiff > 0) {
            switch (true) {
              // Range starts on Sat
              case aDay == 6:
                adj = -1;
                break;
              // Range starts on Sun
              case aDay == 0:
                adj = 0;
                break;
              // Range ends on Sat
              case bDay == 6:
                adj = -1;
                break;
              // Range ends on Sun
              case bDay == 0:
                adj = -2;
                break;
              // Range contains weekend
              case (dayMark + mod) > 5:
                adj = -2;
                break;
              default:
                // Do nothing
                break;
            }
          }
          else if (dayDiff < 0) {
            switch (true) {
              // Range starts on Sat
              case aDay == 6:
                adj = 0;
                break;
              // Range starts on Sun
              case aDay == 0:
                adj = 1;
                break;
              // Range ends on Sat
              case bDay == 6:
                adj = 2;
                break;
              // Range ends on Sun
              case bDay == 0:
                adj = 1;
                break;
              // Range contains weekend
              case (dayMark + mod) < 0:
                adj = 2;
                break;
              default:
                // Do nothing
                break;
            }
          }
          days += adj;
          days -= (weeks*2);
        }
        delta = days;

        break;
      case dateParts.HOUR:
        delta = houDiff;
        break;
      case dateParts.MINUTE:
        delta = minDiff;
        break;
      case dateParts.SECOND:
        delta = secDiff;
        break;
      case dateParts.MILLISECOND:
        delta = msDiff;
        break;
      default:
        // Do nothing
        break;
    }
    // Round for fractional values and DST leaps
    return Math.round(delta); // Number (integer)
  };

  /**
    @name date#parse
    @public
    @function
    @return {Date} a JavaScript Date object
    @description Convert various sorts of strings to JavaScript
    Date objects
    @param {String} val The string to convert to a Date
  */
  this.parse = function (val) {
    var dt
      , matches
      , reordered
      , off
      , posOff
      , offHours
      , offMinutes
      , curr
      , stamp
      , utc;

    // Yay, we have a date, use it as-is
    if (val instanceof Date || typeof val.getFullYear == 'function') {
      dt = val;
    }

    // Timestamp?
    else if (typeof val == 'number') {
      dt = new Date(val);
    }

    // String or Array
    else {
      // Value preparsed, looks like [yyyy, mo, dd, hh, mi, ss, ms, (offset?)]
      if (_isArray(val)) {
        matches = val;
        matches.unshift(null);
        matches[8] = null;
      }

      // Oh, crap, it's a string -- parse this bitch
      else if (typeof val == 'string') {
        matches = val.match(_DATETIME_PAT);

        // Stupid US-only format?
        if (!matches) {
          matches = val.match(_US_DATE_PAT);
          if (matches) {
            reordered = [matches[0], matches[3], matches[1], matches[2]];
            // Pad the results to the same length as ISO8601
            reordered[8] = null;
            matches = reordered;
          }
        }

        // Time-stored-in-Date hack?
        if (!matches) {
          matches = val.match(_TIME_PAT);
          if (matches) {
            reordered = [matches[0], 0, 1, 0, matches[1],
                matches[2], matches[3], matches[4], null];
            matches = reordered;
          }
        }

      }

      // Sweet, the regex actually parsed it into something useful
      if (matches) {
        matches.shift(); // First match is entire match, DO NOT WANT

        off = matches.pop();
        // If there's an offset (or the 'Z' non-offset offset), use UTC
        // methods to set everything
        if (off) {
          if (off == 'Z') {
            utc = true;
            offMinutes = 0;
          }
          else {
            utc = false;
            off = off.replace(/\+|-|:/g, '');
            if (parseInt(off, 10) === 0) {
              utc = true;
            }
            else {
              posOff = off.indexOf('+') === 0;
              off = off.substr(1);
              off = off.split(':');
              offHours = parseInt(off[0], 10);
              offMinutes = parseInt(off[1], 10) || 0;
              offMinutes += (offHours * 60);
              if (!posOff) {
                offMinutes = 0 - offMinutes;
              }
            }
          }
        }

        dt = new Date(0);

        // Stupid zero-based months
        matches[1] = parseInt(matches[1], 10) - 1;

        // Specific offset, iterate the array and set each date property
        // using UTC setters, then adjust time using offset
        if (off) {
          for (var i = matches.length - 1; i > -1; i--) {
            curr = parseInt(matches[i], 10) || 0;
            dt['setUTC' + _dateMethods[i]](curr);
          }
          // Add any offset
          dt.setMinutes(dt.getMinutes() - offMinutes);
        }
        // Otherwise we know nothing about the offset, just iterate the
        // array and set each date property using regular setters
        else {
          for (var i = matches.length - 1; i > -1; i--) {
            curr = parseInt(matches[i], 10) || 0;
            dt['set' + _dateMethods[i]](curr);
          }
        }
      }

      // Shit, last-ditch effort using Date.parse
      else {
        stamp = Date.parse(val);
        // Failures to parse yield NaN
        if (!isNaN(stamp)) {
          dt = new Date(stamp);
        }
      }

    }

    return dt || null;
  };

  /**
    @name date#relativeTime
    @public
    @function
    @return {String} A string describing the amount of time ago
    the passed-in Date is
    @description Convert a Date to an English sentence representing
    how long ago the Date was
    @param {Date} dt The Date to to convert to a relative time string
    @param {Object} [opts]
      @param {Boolean} [opts.abbreviated=false] Use short strings
      (e.g., '<1m') for the relative-time string
  */
  this.relativeTime = function (dt, options) {
    var opts = options || {}
      , now = opts.now || new Date()
      , abbr = opts.abbreviated || false
      , format = opts.format || '%F %T'
    // Diff in seconds
      , diff = (now.getTime() - dt.getTime()) / 1000
      , ret
      , num
      , hour = 60*60
      , day = 24*hour
      , week = 7*day
      , month = 30*day;
    switch (true) {
      case diff < 60:
        ret = abbr ? '<1m' : 'less than a minute ago';
        break;
      case diff < 120:
        ret = abbr ? '1m' : 'about a minute ago';
        break;
      case diff < (45*60):
        num = parseInt((diff / 60), 10);
        ret = abbr ? num + 'm' : num + ' minutes ago';
        break;
      case diff < (2*hour):
        ret = abbr ? '1h' : 'about an hour ago';
        break;
      case diff < (1*day):
        num = parseInt((diff / hour), 10);
        ret = abbr ? num + 'h' : 'about ' + num + ' hours ago';
        break;
      case diff < (2*day):
        ret = abbr ? '1d' : 'one day ago';
        break;
      case diff < (7*day):
        num = parseInt((diff / day), 10);
        ret = abbr ? num + 'd' : 'about ' + num + ' days ago';
        break;
      case diff < (11*day):
        ret = abbr ? '1w': 'one week ago';
        break;
      case diff < (1*month):
        num = Math.round(diff / week);
        ret = abbr ? num + 'w' : 'about ' + num + ' weeks ago';
        break;
      default:
        ret = date.strftime(dt, format);
        break;
    }
    return ret;
  };

  /**
    @name date#toISO8601
    @public
    @function
    @return {String} A string describing the amount of time ago
    @description Convert a Date to an ISO8601-formatted string
    @param {Date} dt The Date to to convert to an ISO8601 string
  */
  var _pad = function (n) {
    return n < 10 ? '0' + n : n;
  };
  this.toISO8601 = function (dt, options) {
    var opts = options || {}
      , off = dt.getTimezoneOffset()
      , offHours
      , offMinutes
      , str = this.strftime(dt, '%F') + 'T'
          + this.strftime(dt, '%T') + '.'
          + string.lpad(dt.getMilliseconds(), '0', 3);
    // Pos and neg numbers are both truthy; only
    // zero is falsy
    if (off && !opts.utc) {
      str += off > 0 ? '-' : '+';
      offHours = parseInt(off / 60, 10);
      str += string.lpad(offHours, '0', 2);
      offMinutes = off % 60;
      if (offMinutes) {
        str += string.lpad(offMinutes, '0', 2);
      }
    }
    else {
      str += 'Z';
    }
    return str;
  };

  // Alias
  this.toIso8601 = this.toISO8601;

  this.toUTC = function (dt) {
    return new Date(
        dt.getUTCFullYear()
      , dt.getUTCMonth()
      , dt.getUTCDate()
      , dt.getUTCHours()
      , dt.getUTCMinutes()
      , dt.getUTCSeconds()
      , dt.getUTCMilliseconds());
  };

})();

module.exports = date;



});

require.define("/node_modules/utilities/lib/log.js",function(require,module,exports,__dirname,__filename,process,global){var util = require('util')
  , log
  , _logger
  , _levels
  , _serialize
  , _output;

_levels = {
  'debug': 'log'
, 'info': 'log'
, 'notice': 'log'
, 'warning': 'error'
, 'error': 'error'
, 'critical': 'error'
, 'alert': 'error'
, 'emergency': 'error'
};

_serialize = function (obj) {
  var out;
  if (typeof obj == 'string') {
    out = obj;
  }
  else {
    out = util.inspect(obj);
  }
  return out;
};

_output = function (obj, level) {
  var out = _serialize(obj);
  if (_logger) {
    _logger[level](out);
  }
  else {
    console[_levels[level]](out);
  }
};


log = function (obj) {
  _output(obj, 'info');
};

log.registerLogger = function (logger) {
  // Malkovitch, Malkovitch
  if (logger === log) {
    return;
  }
  _logger = logger;
};

(function () {
  var level;
  for (var p in _levels) {
    (function (p) {
      level = _levels[p];
      log[p] = function (obj) {
        _output(obj, p);
      };
    })(p);
  }
})();

module.exports = log;

});

require.define("util",function(require,module,exports,__dirname,__filename,process,global){var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

});

require.define("/node_modules/utilities/lib/request.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var http = require('http')
  , https = require('https')
  , url = require('url')
  , uri = require('./uri')
  , log = require('./log')
  , core = require('./core');

var formatters = {
  xml: function (data) {
    return data;
  }
, html: function (data) {
    return data;
  }
, txt: function (data) {
    return data;
  }
, json: function (data) {
    return JSON.parse(data);
  }
}

/**
  @name request
  @namespace request
  @public
  @function
  @description Sends requests to the given url sending any data if the method is POST or PUT
  @param {Object} opts The options to use for the request
    @param {String} [opts.url] The URL to send the request to
    @param {String} [opts.method=GET] The method to use for the request
    @param {Object} [opts.headers] Headers to send on requests
    @param {String} [opts.data] Data to send on POST and PUT requests
    @param {String} [opts.dataType] The type of data to send
*/
var request = function (opts, callback) {
  var client
    , options = opts || {}
    , parsed = url.parse(options.url)
    , path
    , requester = parsed.protocol == 'http:' ? http : https
    , method = (options.method && options.method.toUpperCase()) || 'GET'
    , headers = core.mixin({}, options.headers || {})
    , contentLength
    , port
    , clientOpts;

  if (parsed.port) {
    port = parsed.port;
  }
  else {
    port = parsed.protocol == 'http:' ? '80' : '443';
  }

  path = parsed.pathname;
  if (parsed.search) {
    path += parsed.search;
  }

  if (method == 'POST' || method == 'PUT') {
    if (options.data) {
      contentLength = options.data.length;
    }
    else {
      contentLength = 0
    }
    headers['Content-Length'] = contentLength;
  }

  clientOpts = {
    host: parsed.hostname
  , port: port
  , method: method
  , agent: false
  , path: path
  , headers: headers
  };
  client = requester.request(clientOpts);

  client.addListener('response', function (resp) {
    var data = ''
      , dataType;
    resp.addListener('data', function (chunk) {
      data += chunk.toString();
    });
    resp.addListener('end', function () {
      var stat = resp.statusCode
        , err;
      // Successful response
      if ((stat > 199 && stat < 300) || stat == 304) {
        dataType = options.dataType || uri.getFileExtension(parsed.pathname);
        if (formatters[dataType]) {
          try {
            if (data) {
              data = formatters[dataType](data);
            }
          }
          catch (e) {
            callback(e, null);
          }
        }
        callback(null, data);
      }
      // Something failed
      else {
        err = new Error(data);
        err.statusCode = resp.statusCode;
        callback(err, null);
      }

    });
  });

  client.addListener('error', function (e) {
    callback(e, null);
  });

  if ((method == 'POST' || method == 'PUT') && options.data) {
    client.write(options.data);
  }

  client.end();
};

module.exports = request;

});

require.define("http",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("http-browserify")
});

require.define("/node_modules/http-browserify/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js","browserify":"index.js"}
});

require.define("/node_modules/http-browserify/index.js",function(require,module,exports,__dirname,__filename,process,global){var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');

http.request = function (params, cb) {
    if (!params) params = {};
    if (!params.host) params.host = window.location.host.split(':')[0];
    if (!params.port) params.port = window.location.port;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

});

require.define("/node_modules/http-browserify/lib/request.js",function(require,module,exports,__dirname,__filename,process,global){var Stream = require('stream');
var Response = require('./response');
var concatStream = require('concat-stream')

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.writable = true;
    self.xhr = xhr;
    self.body = concatStream()
    
    var uri = params.host + ':' + params.port + (params.path || '/');
    
    xhr.open(
        params.method || 'GET',
        (params.scheme || 'http') + '://' + uri,
        true
    );
    
    if (params.headers) {
        Object.keys(params.headers).forEach(function (key) {
            if (!self.isSafeRequestHeader(key)) return;
            var value = params.headers[key];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    xhr.setRequestHeader(key, v);
                });
            }
            else xhr.setRequestHeader(key, value)
        });
    }
    
    var res = new Response;
    res.on('ready', function () {
        self.emit('response', res);
    });
    
    xhr.onreadystatechange = function () {
        res.handle(xhr);
    };
};

Request.prototype = new Stream;

Request.prototype.setHeader = function (key, value) {
    if ((Array.isArray && Array.isArray(value))
    || value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            this.xhr.setRequestHeader(key, value[i]);
        }
    }
    else {
        this.xhr.setRequestHeader(key, value);
    }
};

Request.prototype.write = function (s) {
    this.body.write(s);
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.write(s);
    this.body.end()
    this.xhr.send(this.body.getBody());
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return (Request.unsafeHeaders.indexOf(headerName.toLowerCase()) === -1)
};

});

require.define("stream",function(require,module,exports,__dirname,__filename,process,global){var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once, and
  // only when all sources have ended.
  if (!dest._isStdio && (!options || options.end !== false)) {
    dest._pipeCount = dest._pipeCount || 0;
    dest._pipeCount++;

    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

});

require.define("/node_modules/http-browserify/lib/response.js",function(require,module,exports,__dirname,__filename,process,global){var Stream = require('stream');

var Response = module.exports = function (res) {
    this.offset = 0;
    this.readable = true;
};

Response.prototype = new Stream;

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
                if ((Array.isArray && Array.isArray(headers[key]))
                || headers[key] instanceof Array) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = xhr.responseType.toLowerCase();
    if (respType === "blob") return xhr.responseBlob;
    if (respType === "arraybuffer") return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this.write(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this.write(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
    }
};

Response.prototype.write = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

});

require.define("/node_modules/http-browserify/node_modules/concat-stream/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {}
});

require.define("/node_modules/http-browserify/node_modules/concat-stream/index.js",function(require,module,exports,__dirname,__filename,process,global){var stream = require('stream')
var util = require('util')

function ConcatStream(cb) {
  stream.Stream.call(this)
  this.writable = true
  if (cb) this.cb = cb
  this.body = []
  if (this.cb) this.on('error', cb)
}

util.inherits(ConcatStream, stream.Stream)

ConcatStream.prototype.write = function(chunk) {
  this.body.push(chunk)
}

ConcatStream.prototype.arrayConcat = function(arrs) {
  if (arrs.length === 0) return []
  if (arrs.length === 1) return arrs[0]
  return arrs.reduce(function (a, b) { return a.concat(b) })
}

ConcatStream.prototype.isArray = function(arr) {
  var isArray = Array.isArray(arr)
  var isTypedArray = arr.toString().match(/Array/)
  return isArray || isTypedArray
}

ConcatStream.prototype.getBody = function () {
  if (this.body.length === 0) return
  if (typeof(this.body[0]) === "string") return this.body.join('')
  if (this.isArray(this.body[0])) return this.arrayConcat(this.body)
  if (typeof(Buffer) !== "undefined" && Buffer.isBuffer(this.body[0])) {
    return Buffer.concat(this.body)
  }
  return this.body
}

ConcatStream.prototype.end = function() {
  if (this.cb) this.cb(false, this.getBody())
}

module.exports = function(cb) {
  return new ConcatStream(cb)
}

module.exports.ConcatStream = ConcatStream

});

require.define("https",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('http');

});

require.define("url",function(require,module,exports,__dirname,__filename,process,global){var punycode = { encode : function (s) { return s } };

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

function arrayIndexOf(array, subject) {
    for (var i = 0, j = array.length; i < j; i++) {
        if(array[i] == subject) return i;
    }
    return -1;
}

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = arrayIndexOf(rest, '@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = arrayIndexOf(rest, nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = arrayIndexOf(rest, nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = objectKeys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = arrayIndexOf(rest, delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = arrayIndexOf(rest, '#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = arrayIndexOf(rest, '?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                objectKeys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

});

require.define("querystring",function(require,module,exports,__dirname,__filename,process,global){var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

});

require.define("/node_modules/utilities/lib/network.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

var network
	, net = require('net');

/**
  @name network
  @namespace network
*/

network = new (function () {
	/**
		@name network#isPortOpen
		@public
		@function
		@description Checks if the given port in the given host is open
		@param {Number} port number
		@param {String} host
		@param {Function} callback Callback function -- should be in the format
			of function(err, result) {}
	*/
	this.isPortOpen = function (port, host, callback) {
		if (typeof host === 'function' && !callback) {
			callback = host;
			host = 'localhost';
		}

		var isOpen = false
			, connection
			, error;

		connection = net.createConnection(port, host, function () {
			isOpen = true;
			connection.end();
		});

		connection.on('error', function (err) {
			// We ignore 'ECONNREFUSED' as it simply indicates the port isn't open.
			// Anything else is reported
			if(err.code !== 'ECONNREFUSED') {
				error = err;
			}
		});

		connection.setTimeout(400, function () {
			connection.end();
		});

		connection.on('close', function () {
			callback && callback(error, isOpen);
		});
	};

})();

module.exports = network;
});

require.define("net",function(require,module,exports,__dirname,__filename,process,global){// todo

});

require.define("/node_modules/utilities/lib/event_buffer.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
This is a very simple buffer for a predetermined set of events. It is unbounded.
It forwards all arguments to any outlet emitter attached with sync().

Example:
    var source = new Stream()
      , dest = new EventEmitter()
      , buff = new EventBuffer(source)
      , data = '';
    dest.on('data', function (d) { data += d; });
    source.writeable = true;
    source.readable = true;
    source.emit('data', 'abcdef');
    source.emit('data', '123456');
    buff.sync(dest);
*/

/**
  @name EventBuffer
  @namespace EventBuffer
  @constructor
*/

var EventBuffer = function (src, events) {
  // By default, we service the default stream events
  var self = this
    , streamEvents = ['data', 'end', 'error', 'close', 'fd', 'drain', 'pipe'];
  this.events = events || streamEvents;
  this.emitter = src;
  this.eventBuffer = [];
  this.outlet = null;
  this.events.forEach(function (name) {
    self.emitter.addListener(name, function () {
      self.proxyEmit(name, arguments);
    });
  });
};

EventBuffer.prototype = new (function () {
  /**
    @name EventBuffer#proxyEmit
    @public
    @function
    @description Emit an event by name and arguments or add it to the buffer if
      no outlet is set
    @param {String} name The name to use for the event
    @param {Array} args An array of arguments to emit
  */
  this.proxyEmit = function (name, args) {
    if (this.outlet) {
      this.emit(name, args);
    }
    else {
      this.eventBuffer.push({name: name, args: args});
    }
  };

  /**
    @name EventBuffer#emit
    @public
    @function
    @description Emit an event by name and arguments
    @param {String} name The name to use for the event
    @param {Array} args An array of arguments to emit
  */
  this.emit = function (name, args) {
    // Prepend name to args
    var outlet = this.outlet;
    Array.prototype.splice.call(args, 0, 0, name);
    outlet.emit.apply(outlet, args);
  };

  /**
    @name EventBuffer#sync
    @public
    @function
    @description Flush the buffer and continue piping new events to the outlet
    @param {Object} outlet The emitter to send events too
  */
  this.sync = function (outlet) {
    var buffer = this.eventBuffer
      , bufferItem;
    this.outlet = outlet;
    while ((bufferItem = buffer.shift())) {
      this.emit(bufferItem.name, bufferItem.args);
    }
  };
})();
EventBuffer.prototype.constructor = EventBuffer;

module.exports.EventBuffer = EventBuffer;

});

require.define("/node_modules/utilities/lib/xml.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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
var core = require('./core')
  , inflection = require('./inflection')

/**
  @name xml
  @namespace xml
*/

exports.XML = new (function () {

  // Default indention level
  var indentLevel = 4
    , tagFromType
    , obj2xml;

  tagFromType = function (item, prev) {
    var ret
      , type
      , types;

    if (item instanceof Array) {
      ret = 'array';
    } else {
      types = ['string', 'number', 'boolean', 'object'];
      for (var i = 0, ii = types.length; i < ii; i++) {
        type = types[i];
        if (typeof item == type) {
          ret = type;
        }
      }
    }

    if (prev && ret != prev) {
      return 'record'
    } else {
      return ret;
    }
  };

  obj2xml = function (o, opts) {
    var name = opts.name
      , level = opts.level
      , arrayRoot = opts.arrayRoot
      , pack
      , item
      , n
      , currentIndent = (new Array(level * indentLevel)).join(' ')
      , nextIndent = (new Array((level + 1) * indentLevel)).join(' ')
      , xml = '';

    switch (typeof o) {
      case 'string':
      case 'number':
      case 'boolean':
        xml = o.toString();
        break;
      case 'object':
        // Arrays
        if (o instanceof Array) {

          // Pack the processed version of each item into an array that
          // can be turned into a tag-list with a `join` method below
          // As the list gets iterated, if all items are the same type,
          // that's the tag-name for the individual tags. If the items are
          // a mixed, the tag-name is 'record'
          pack = [];
          for (var i = 0, ii = o.length; i < ii; i++) {
            item = o[i];
            if (!name) {
              // Pass any previous tag-name, so it's possible to know if
              // all items are the same type, or it's mixed types
              n = tagFromType(item, n);
            }
            pack.push(obj2xml(item, {
              name: name
            , level: level + 1
            , arrayRoot: arrayRoot
            }));
          }

          // If this thing is attached to a named property on an object,
          // use the name for the containing tag-name
          if (name) {
            n = name;
          }

          // If this is a top-level item, wrap in a top-level containing tag
          if (level == 0) {
            xml += currentIndent + '<' + inflection.pluralize(n) + ' type="array">\n'
          }
          xml += nextIndent + '<' + n + '>' +
              pack.join('</' + n + '>\n' + nextIndent +
                  '<' + n + '>') + '</' + n + '>\n';

          // If this is a top-level item, close the top-level containing tag
          if (level == 0) {
            xml += currentIndent + '</' + inflection.pluralize(n) + '>';
          }
        }
        // Generic objects
        else {
          n = name || 'object';

          // If this is a top-level item, wrap in a top-level containing tag
          if (level == 0) {
            xml += currentIndent + '<' + n;
            // Lookahead hack to allow tags to have attributes
            for (var p in o) {
              if (p.indexOf('attr:') == 0) {
                xml += ' ' + p.replace(/^attr:/, '') + '="' +
                    o[p] + '"'
              }
            }
            xml += '>\n';
          }
          for (var p in o) {
            item = o[p];

            // Data properties only
            if (typeof item == 'function') {
              continue;
            }
            // No attr hack properties
            if (p.indexOf('attr:') == 0) {
              continue;
            }

            xml += nextIndent;

            if (p == '#cdata') {
              xml += '<![CDATA[' + item + ']]>\n';
            }
            else {

              // Complex values, going to have items with multiple tags
              // inside
              if (typeof item == 'object') {
                if (item instanceof Array) {
                  if (arrayRoot) {
                    xml += '<' + p + ' type="array">\n'
                  }
                }
                else {
                  xml += '<' + p;
                  // Lookahead hack to allow tags to have attributes
                  for (var q in item) {
                    if (q.indexOf('attr:') == 0) {
                      xml += ' ' + q.replace(/^attr:/, '') + '="' +
                          item[q] + '"'
                    }
                  }
                  xml += '>\n';
                }
              }
              // Scalars, just a value and closing tag
              else {
                xml += '<' + p + '>'
              }
              xml += obj2xml(item, {
                name: p
              , level: level + 1
              , arrayRoot: arrayRoot
              });

              // Objects and Arrays, need indentation before closing tag
              if (typeof item == 'object') {
                if (item instanceof Array) {
                  if (arrayRoot) {
                    xml += nextIndent;
                    xml += '</' + p + '>\n';
                  }
                }
                else {
                  xml += nextIndent;
                  xml += '</' + p + '>\n';
                }
              }
              // Scalars, just close
              else {
                xml += '</' + p + '>\n';
              }
            }
          }
          // If this is a top-level item, close the top-level containing tag
          if (level == 0) {
            xml += currentIndent + '</' + n + '>\n';
          }
        }
        break;
      default:
        // No default
    }
    return xml;
  }

  /*
   * XML configuration
   *
  */
  this.config = {
      whitespace: true
    , name: null
    , fragment: false
    , level: 0
    , arrayRoot: true
  };

  /**
    @name xml#setIndentLevel
    @public
    @function
    @return {Number} Return the given `level`
    @description SetIndentLevel changes the indent level for XML.stringify and returns it
    @param {Number} level The indent level to use
  */
  this.setIndentLevel = function (level) {
    if(!level) {
      return;
    }

    return indentLevel = level;
  };

  /**
    @name xml#stringify
    @public
    @function
    @return {String} Return the XML entities of the given `obj`
    @description Stringify returns an XML representation of the given `obj`
    @param {Object} obj The object containing the XML entities to use
    @param {Object} opts
      @param {Boolean} [opts.whitespace=true] Don't insert indents and newlines after xml entities
      @param {String} [opts.name=typeof obj] Use custom name as global namespace
      @param {Boolean} [opts.fragment=false] If true no header fragment is added to the top
      @param {Number} [opts.level=0] Remove this many levels from the output
      @param {Boolean} [opts.arrayRoot=true]
  */
  this.stringify = function (obj, opts) {
    var config = core.mixin({}, this.config)
      , xml = '';
    core.mixin(config, (opts || {}));

    if (!config.whitespace) {
      indentLevel = 0;
    }

    if (!config.fragment) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += obj2xml(obj, {
      name: config.name
    , level: config.level
    , arrayRoot: config.arrayRoot
    });

    if (!config.whitespace) {
      xml = xml.replace(/>\n/g, '>');
    }

    return xml;
  };

})();


});

require.define("/node_modules/utilities/lib/sorted_collection.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Utilities: A classic collection of JavaScript utilities
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

/**
  @name SortedCollection
  @namespace SortedCollection
  @constructor
*/

var SortedCollection = function (d) {
  this.count = 0;
  this.items = {}; // Hash keys and their values
  this.order = []; // Array for sort order
  if (d) {
    this.defaultValue = d;
  };
};

SortedCollection.prototype = new (function () {
  /**
    @name SortedCollection#addItem
    @public
    @function
    @return {Any} The given val is returned
    @description Adds a new key/value to the collection
    @param {String} key The key for the collection item
    @param {Any} val The value for the collection item
  */
  this.addItem = function (key, val) {
    if (typeof key != 'string') {
      throw('Hash only allows string keys.');
    }
    return this.setByKey(key, val);
  };

  /**
    @name SortedCollection#getItem
    @public
    @function
    @return {Any} The value for the given identifier is returned
    @description Retrieves the value for the given identifier that being a key or index
    @param {String/Number} p The identifier to look in the collection for, being a key or index
  */
  this.getItem = function (p) {
    if (typeof p == 'string') {
      return this.getByKey(p);
    }
    else if (typeof p == 'number') {
      return this.getByIndex(p);
    }
  };

  /**
    @name SortedCollection#setItem
    @public
    @function
    @return {Any} The given val is returned
    @description Sets the item in the collection with the given val, overwriting the existsing item
      if identifier is an index
    @param {String/Number} p The identifier set in the collection, being either a key or index
    @param {Any} val The value for the collection item
  */
  this.setItem = function (p, val) {
    if (typeof p == 'string') {
      return this.setByKey(p, val);
    }
    else if (typeof p == 'number') {
      return this.setByIndex(p, val);
    }
  };

  /**
    @name SortedCollection#removeItem
    @public
    @function
    @return {Boolean} Returns true if the item has been removed, false otherwise
    @description Removes the item for the given identifier
    @param {String/Number} p The identifier to delete the item for, being a key or index
  */
  this.removeItem = function (p) {
    if (typeof p == 'string') {
      return this.removeByKey(p);
    }
    else if (typeof p == 'number') {
      return this.removeByIndex(p);
    }
  };

  /**
    @name SortedCollection#getByKey
    @public
    @function
    @return {Any} The value for the given key item is returned
    @description Retrieves the value for the given key
    @param {String} key The key for the item to lookup
  */
  this.getByKey = function (key) {
    return this.items[key];
  };

  /**
    @name SortedCollection#setByKey
    @public
    @function
    @return {Any} The given val is returned
    @description Sets a item by key assigning the given val
    @param {String} key The key for the item
    @param {Any} val The value to set for the item
  */
  this.setByKey = function (key, val) {
    var v = null;
    if (typeof val == 'undefined') {
      v = this.defaultValue;
    }
    else { v = val; }
    if (typeof this.items[key] == 'undefined') {
      this.order[this.count] = key;
      this.count++;
    }
    this.items[key] = v;
    return this.items[key];
  };

  /**
    @name SortedCollection#removeByKey
    @public
    @function
    @return {Boolean} If the item was removed true is returned, false otherwise
    @description Removes a collection item by key
    @param {String} key The key for the item to remove
  */
  this.removeByKey = function (key) {
    if (typeof this.items[key] != 'undefined') {
      var pos = null;
      delete this.items[key]; // Remove the value
      // Find the key in the order list
      for (var i = 0; i < this.order.length; i++) {
        if (this.order[i] == key) {
          pos = i;
        }
      }
      this.order.splice(pos, 1); // Remove the key
      this.count--; // Decrement the length
      return true;
    }
    else {
      return false;
    }
  };

  /**
    @name SortedCollection#getByIndex
    @public
    @function
    @return {Any} The value for the given index item is returned
    @description Retrieves the value for the given index
    @param {Number} ind The index to lookup for the item
  */
  this.getByIndex = function (ind) {
    return this.items[this.order[ind]];
  };

  /**
    @name SortedCollection#setByIndex
    @public
    @function
    @return {Any} The given val is returned
    @description Sets a item by index assigning the given val
    @param {Number} ind The index for the item
    @param {Any} val The value to set for the item
  */
  this.setByIndex = function (ind, val) {
    if (ind < 0 || ind >= this.count) {
      throw('Index out of bounds. Hash length is ' + this.count);
    }
    this.items[this.order[ind]] = val;
    return this.items[this.order[ind]];
  };

  /**
    @name SortedCollection#removeByIndex
    @public
    @function
    @return {Boolean} If the item was removed true is returned, false otherwise
    @description Removes a collection item by index
    @param {Number} ind The index for the item to remove
  */
  this.removeByIndex = function (ind) {
    var ret = this.items[this.order[ind]];
    if (typeof ret != 'undefined') {
      delete this.items[this.order[ind]]
      this.order.splice(ind, 1);
      this.count--;
      return true;
    }
    else {
      return false;
    }
  };

  /**
    @name SortedCollection#hasKey
    @public
    @function
    @return {Boolean} Returns true if the item exists, false otherwise
    @description Checks if a key item exists in the collection
    @param {String} key The key to look for in the collection
  */
  this.hasKey = function (key) {
    return typeof this.items[key] != 'undefined';
  };

  /**
    @name SortedCollection#hasValue
    @public
    @function
    @return {Boolean} Returns true if a key with the given value exists, false otherwise
    @description Checks if a key item in the collection has a given val
    @param {Any} val The value to check for in the collection
  */
  this.hasValue = function (val) {
    for (var i = 0; i < this.order.length; i++) {
      if (this.items[this.order[i]] == val) {
        return true;
      }
    }
    return false;
  };

  /**
    @name SortedCollection#allKeys
    @public
    @function
    @return {String} Returns all the keys in a string
    @description Joins all the keys into a string
    @param {String} str The string to use between each key
  */
  this.allKeys = function (str) {
    return this.order.join(str);
  };

  /**
    @name SortedCollection#replaceKey
    @public
    @function
    @description Joins all the keys into a string
    @param {String} oldKey The key item to change
    @param {String} newKey The key item to change the name to
  */
  this.replaceKey = function (oldKey, newKey) {
    // If item for newKey exists, nuke it
    if (this.hasKey(newKey)) {
      this.removeItem(newKey);
    }
    this.items[newKey] = this.items[oldKey];
    delete this.items[oldKey];
    for (var i = 0; i < this.order.length; i++) {
      if (this.order[i] == oldKey) {
        this.order[i] = newKey;
      }
    }
  };

  /**
    @name SortedCollection#insertAtIndex
    @public
    @function
    @return {Boolean} Returns true if the item was set at the given index
    @description Inserts a key/value at a specific index in the collection
    @param {Number} ind The index to set the item at
    @param {String} key The key to use at the item index
    @param {Any} val The value to set for the item
  */
  this.insertAtIndex = function (ind, key, val) {
    this.order.splice(ind, 0, key);
    this.items[key] = val;
    this.count++;
    return true;
  };

  /**
    @name SortedCollection#insertAfterKey
    @public
    @function
    @return {Boolean} Returns true if the item was set for the given key
    @description Inserts a key/value item after the given reference key in the collection
    @param {String} refKey The key to insert the new item after
    @param {String} key The key for the new item
    @param {Any} val The value to set for the item
  */
  this.insertAfterKey = function (refKey, key, val) {
    var pos = this.getPosition(refKey);
    return this.insertAtIndex(pos, key, val);
  };

  /**
    @name SortedCollection#getPosition
    @public
    @function
    @return {Number} Returns the index for the item of the given key
    @description Retrieves the index of the key item
    @param {String} key The key to get the index for
  */
  this.getPosition = function (key) {
    var order = this.order;
    if (typeof order.indexOf == 'function') {
      return order.indexOf(key);
    }
    else {
      for (var i = 0; i < order.length; i++) {
        if (order[i] == key) { return i;}
      }
    }
  };

  /**
    @name SortedCollection#each
    @public
    @function
    @return {Boolean}
    @description Loops through the collection and calls the given function
    @param {Function} func The function to call for each collection item, the arguments
      are the key and value for the current item
    @param {Object} opts The options to use
      @param {Boolean} [opts.keyOnly] Only give the function the key
      @param {Boolean} [opts.valueOnly] Only give the function the value
  */
  this.each = function (func, opts) {
    var options = opts || {}
      , order = this.order;
    for (var i = 0, ii = order.length; i < ii; i++) {
      var key = order[i];
      var val = this.items[key];
      if (options.keyOnly) {
        func(key);
      }
      else if (options.valueOnly) {
        func(val);
      }
      else {
        func(val, key);
      }
    }
    return true;
  };

  /**
    @name SortedCollection#eachKey
    @public
    @function
    @return {Boolean}
    @description Loops through the collection and calls the given function
    @param {Function} func The function to call for each collection item, only giving the
      key to the function
  */
  this.eachKey = function (func) {
    return this.each(func, { keyOnly: true });
  };

  /**
    @name SortedCollection#eachValue
    @public
    @function
    @return {Boolean}
    @description Loops through the collection and calls the given function
    @param {Function} func The function to call for each collection item, only giving the
      value to the function
  */
  this.eachValue = function (func) {
    return this.each(func, { valueOnly: true });
  };

  /**
    @name SortedCollection#clone
    @public
    @function
    @return {Object} Returns a new SortedCollection with the data of the current one
    @description Creates a cloned version of the current collection and returns it
  */
  this.clone = function () {
    var coll = new SortedCollection()
      , key
      , val;
    for (var i = 0; i < this.order.length; i++) {
      key = this.order[i];
      val = this.items[key];
      coll.setItem(key, val);
    }
    return coll;
  };

  /**
    @name SortedCollection#concat
    @public
    @function
    @description Join a given collection with the current one
    @param {Object} hNew A SortedCollection to join from
  */
  this.concat = function (hNew) {
    for (var i = 0; i < hNew.order.length; i++) {
      var key = hNew.order[i];
      var val = hNew.items[key];
      this.setItem(key, val);
    }
  };

  /**
    @name SortedCollection#push
    @public
    @function
    @return {Number} Returns the count of items
    @description Appends a new item to the collection
    @param {String} key The key to use for the item
    @param {Any} val The value to use for the item
  */
  this.push = function (key, val) {
    this.insertAtIndex(this.count, key, val);
    return this.count;
  };

  /**
    @name SortedCollection#pop
    @public
    @function
    @return {Any} Returns the value for the last item in the collection
    @description Pops off the last item in the collection and returns it's value
  */
  this.pop = function () {
    var pos = this.count-1;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return;
    }
  };

  /**
    @name SortedCollection#unshift
    @public
    @function
    @return {Number} Returns the count of items
    @description Prepends a new item to the beginning of the collection
    @param {String} key The key to use for the item
    @param {Any} val The value to use for the item
  */
  this.unshift = function (key, val) {
    this.insertAtIndex(0, key, val);
    return this.count;
  };

  /**
    @name SortedCollection#shift
    @public
    @function
    @return {Number} Returns the removed items value
    @description Removes the first item in the list and returns it's value
  */
  this.shift = function () {
    var pos = 0;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return;
    }
  };

  /**
    @name SortedCollection#splice
    @public
    @function
    @description Removes items from index to the given max and then adds the given
      collections items
    @param {Number} index The index to start at when removing items
    @param {Number} numToRemove The number of items to remove before adding the new items
    @param {Object} hash the collection of items to add
  */
  this.splice = function (index, numToRemove, hash) {
    var _this = this;
    // Removal
    if (numToRemove > 0) {
      // Items
      var limit = index + numToRemove;
      for (var i = index; i < limit; i++) {
        delete this.items[this.order[i]];
      }
      // Order
      this.order.splice(index, numToRemove);
    }
    // Adding
    if (hash) {
      // Items
      for (var i in hash.items) {
        this.items[i] = hash.items[i];
      }
      // Order
      var args = hash.order;
      args.unshift(0);
      args.unshift(index);
      this.order.splice.apply(this.order, args);
    }
    this.count = this.order.length;
  };

  this.sort = function (c) {
    var arr = [];
    // Assumes vals are comparable scalars
    var comp = function (a, b) {
      return c(a.val, b.val);
    }
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      arr[i] = { key: key, val: this.items[key] };
    }
    arr.sort(comp);
    this.order = [];
    for (var i = 0; i < arr.length; i++) {
      this.order.push(arr[i].key);
    }
  };

  this.sortByKey = function (comp) {
    this.order.sort(comp);
  };

  /**
    @name SortedCollection#reverse
    @public
    @function
    @description Reverse the collection item list
  */
  this.reverse = function () {
    this.order.reverse();
  };

})();

module.exports.SortedCollection = SortedCollection;

});

require.define("/node_modules/model/lib/adapters/index.js",function(require,module,exports,__dirname,__filename,process,global){
var adapters
  , path = require('path')
  , _aliases
  , _paths;

_aliases = {
  postgres: 'postgres'
, pg: 'postgres'
, postgresql: 'postgres'
, riak: 'riak'
, mongo: 'mongo'
, memory: 'memory'
};

_paths = {
  postgres: 'sql/postgres'
, riak: 'riak/index'
, mongo: 'mongo/index'
, memory: 'memory/index'
};

adapters = new (function () {

  this.getAdapterInfo = function (adapter) {
    var canonical = _aliases[adapter];
    if (!canonical) {
      return null;
    }
    else {
      return {
        name: canonical
      , filePath: _paths[canonical]
      };
    }
  };

})();

module.exports = adapters;

});

require.define("/node_modules/model/lib/validators.js",function(require,module,exports,__dirname,__filename,process,global){/*
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

var utils = require('utilities')
  , i18n = utils.i18n;

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

});

require.define("/node_modules/model/lib/formatters.js",function(require,module,exports,__dirname,__filename,process,global){
var formatters = new function () {
  this.date = function (val) {
    return geddy.date.strftime(val, geddy.config.dateFormat);
  };

  this.time = function (val) {
    return geddy.date.strftime(val, geddy.config.timeFormat);
  };

}();

module.exports = formatters;

});

require.define("/node_modules/model/lib/query/query.js",function(require,module,exports,__dirname,__filename,process,global){
var query = {}
  , Query
  , utils = require('utilities')
  , model = require('../index')
  , operation = require('./operation')
  , comparison = require('./comparison');

Query = function (model, conditions, options) {
  this.model = null;
  this.conditions = null;
  this.initialize.apply(this, arguments);
};

Query.comparisonTypes = {
  'eql': 'EqualTo'
, 'ne': 'NotEqualTo'
, 'in': 'Inclusion'
, 'like': 'Like'
, 'gt': 'GreaterThan'
, 'lt': 'LessThan'
, 'gte': 'GreaterThanOrEqual'
, 'lte': 'LessThanOrEqual'
};

Query.prototype = new (function () {

  var _operationTypes = {
        'and': true
      , 'or': true
      , 'not': true
      , 'null': true
      }

    , _createIsValidField = function () {
        var reg = {
              id: true
            , createdAt: true
            , updatedAt: true
            }
          , props = model.descriptionRegistry[
              this.model.modelName].properties;
        for (var p in props) {
          reg[p] = true;
        }
        return function (key) {
          return !!reg[key];
        };
      }

    , _createOperation = function (conditions, key) {
        var self = this
          , type = key || 'and'
          , cond
          , item
          , op = operation.create(type)
          , notOperand
          , operand;

        // TODO: Handle associations
        for (var k in conditions) {
          cond = conditions[k];

          // Operation type, can contain other operations/conditions
          if (_operationTypes[k]) {
            // Base operation-type to create: if the type is a 'not',
            // create a single 'and' with the same conditions to wrap
            // in a 'not'
            type = k == 'not' ? 'and' : k;

            // If the conditions are an array, create a single 'and'
            // op that wraps each set of conditions in each item, and
            // add to the wrapper
            if (Array.isArray(cond)) {
              // Create empty wrapper
              operand = operation.create(type);
              cond.forEach(function (c) {
                operand.add(_createOperation.apply(self, [c, 'and']));
              });
            }
            // Simple object-literal, just create an operation
            else {
              operand = _createOperation.apply(this, [cond, type]);
            }

            // If this was a 'not' operation, create a wrapping 'not'
            // to contain the single operation created
            if (k == 'not') {
              notOperand = operation.create(k);
              notOperand.add(operand);
              operand = notOperand;
            }
          }

          // Simple condition (leaf-node)
          else {
            operand = _createComparison.apply(this, [cond, k]);
          }

          op.add(operand);
        }
        return op;
      }

    , _createComparison = function (val, key) {
        var type
          , descr = model.descriptionRegistry[
              this.model.modelName].properties[key]
          , datatype
          , opts = _createComparisonOpts.apply(this, [key]);

        // Non-null objects
        if (val && typeof val == 'object') {
          // {id: ['foo', 'bar', 'baz']}, shorthand for Inclusion
          if (Array.isArray(val)) {
            type = 'in';
          }
          // {id: {'like': 'foo'}}
          else {
            for (var p in val) {
              type = p;
              val = val[p];
            }
          }
        }
        else {
          type = 'eql'
        }

        // FIXME: How the fuck to handle IDs?
        // id isn't in the defined props
        if (key == 'id') {
          datatype = 'string';
          // Flag this as a simple id-lookup for adapters that can
          // optimize for this case
          if (type == 'eql') {
            this.byId = val;
          }
        }
        else {
          datatype = descr.datatype;
        }

        // TODO: Validate the value for both the particular field
        // (e.g., must be a numeric) and the type of comparison
        // (e.g., 'IN' must be a collection, etc)
        return comparison.create(Query.comparisonTypes[type], key, val,
            datatype, opts);
      }

    , _createComparisonOpts = function (key) {
        var opts = this.opts
          , nocase = opts.nocase
          , ret = {};
        ['nocase'].forEach(function (k) {
          var opt = opts[k]
            , included;
          if (opt) {
            if (Array.isArray(opt)) {
              if (opt.some(function (o) {
                return o == key;
              })) {
                ret[k] = true;
              }
            }
            else {
              ret[k] = true;
            }
          }
        });
        return ret;
      }

    , _parseOpts = function (options) {
        var opts = options || {}
          , ret = {}
          , val
          , parsed
          , defaultDir = 'asc';
        for (var prop in opts) {
          val = opts[prop];
          switch (prop) {
            case 'sort':
              // 'foo,bar,baz'
              if (typeof val == 'string') {
                val = val.split(',');
              }
              // ['foo', 'bar', 'baz']
              if (Array.isArray(val)) {
                parsed = {};
                val.forEach(function (v) {
                  parsed[v] = defaultDir;
                });
              }
              else {
                parsed = val;
              }
              // Now there's a well-formed obj, validate fields
              for (var p in parsed) {
                val = parsed[p].toLowerCase();
                if (!this.isValidField(p)) {
                  throw new Error(p + ' is not a valid field for ' +
                      this.model.modelName);
                }
                if (!(val == 'asc' || val == 'desc')) {
                  throw new Error('Sort directon for ' + p +
                      ' field on ' + this.model.modelName + ' must be ' +
                      'either "asc" or "desc"');
                }
              }
              ret[prop] = parsed;
              break;
            case 'limit':
            case 'skip':
              if (isNaN(val)) {
                throw new Error('"' + prop + '" must be a number.');
              }
              ret[prop] = Number(val);
              break;
            default:
              ret[prop] = val;
          }
        }
        return ret;
      };

  this.initialize = function (model, conditionParams, opts) {
    this.byId = null;
    this.model = model;
    this.isValidField = _createIsValidField.apply(this);
    this.opts = _parseOpts.apply(this, [opts || {}]);
    this.conditions = _createOperation.apply(this, [conditionParams]);
    this.rawConditions = conditionParams;
  };

})();

query.Query = Query;

module.exports = query;

});

require.define("/node_modules/model/lib/query/operation.js",function(require,module,exports,__dirname,__filename,process,global){var utils = require('utilities')
  , operation = {}
  , OperationBase
  , operationTypes;

operation.create = function () {
  var args = Array.prototype.slice.call(arguments)
    , type = args.shift()
    , ctor = utils.string.capitalize(type) + 'Operation'
    , inst;

    ctor = operationTypes[ctor];
    inst = new ctor();
    inst.type = type;
    inst.initialize.apply(inst, args);
    return inst;
};


OperationBase = function () {

  this.initialize = function () {
    var operands = Array.prototype.slice.call(arguments);

    this.parent = null;
    this.descendants = [];
    this.operands = [];

    this.merge(operands);
  };

  this.forEach = function (f) {
    this.operands.forEach(f);
  };

  this.isEmpty = function () {
    return !this.operands.length;
  };

  this.isValid = function () {
    var self = this;
    return (!this.isEmpty() && this.operands.every(function (op) {
      return self.validOperand(op);
    }));
  };

  this.validOperand = function (op) {
    return typeof op.isValid == 'function' ?
      op.isValid() : true;
  };

  this.add = function (operand) {
    // Flatten if same type, to create a shallower tree
    if (operand.type == this.type) {
      this.merge(operand.operands);
    }
    else {
      this.operands.push(operand);
      operand.parent = this;
    }
  };

  // Can take args or a single array-arg
  this.merge = function (operands) {
    var self = this
      , ops = Array.isArray(operands) ?
        operands : Array.prototype.slice.call(arguments);
    ops.forEach(function (op) {
      self.add(op);
    });
  };

  this.union = function (other) {
    return (create('or', this, other)).minimize();
  };

  this.intersection  = function () {
    return (create('and', this, other)).minimize();
  };

  this.difference = function () {
    return (create('and', this, create('not', other))).minimize();
  };

  this.minimize = function () {
    return this;
  };

  this.clear = function () {
    this.operands = [];
  };

  this.minimizeOperands = function () {
    var self = this;
    this.operands = this.operands.map(function (op) {
      var min = typeof op.minimize == 'function' ?
          op.minimize() : op;
      min.parent = self;
      return min;
    });
  };

  this.pruneOperands = function () {
    this.operands = this.operands.filter(function (op) {
      return typeof op.isEmpty == 'function' ?
        !op.isEmpty() : true;
    });
  };

  // FIXME: Is this needed?
  this.isNull = function () {
    return false;
  };

};

operationTypes = {
  AndOperation: function () {

    this.matches = function (record) {
      return this.operands.every(function (op) {
        return typeof op.matches == 'function' ?
          op.matches(record) : true;
      });
    };

    this.minimize = function () {
      this.minimizeOperands();

      if (!this.isEmpty() && this.operands.every(function (op) {
        return op.isNull();
      })) {
        return create('null');
      }

      this.pruneOperands();

      if (this.operands.length == 1) {
        return this.operands[0];
      }
      return this;
    };
  }

, OrOperation: function () {

    this.matches = function (record) {
      return this.operands.some(function (op) {
        return typeof op.matches == 'function' ?
          op.matches(record) : true;
      });
    }

    this.isValid = function () {
      var self = this;
      return (!this.isEmpty() && this.operands.some(function (op) {
        return self.validOperand(op);
      }));
    };

    this.minimize = function () {
      this.minimizeOperands();

      if (!this.isEmpty() && this.operands.some(function (op) {
        return op.isNull();
      })) {
        return create('null');
      }

      this.pruneOperands();

      if (this.operands.length == 1) {
        return this.operands[0];
      }
      return this;
    };
  }

, NotOperation: function () {
    this.add = function (operand) {
      // Assert there's only one operand
      if (this.operands.length) {
        throw new Error('Not operation can only have one operand.');
      }
      // Assert that the single operand isn't a self-reference
      if (this.operand === this) {
        throw new Error('Operand for Not operation can\'t be a self-reference.');
      }
      this.constructor.prototype.add.apply(this, arguments);
    };

    this.minimize = function () {
      var operand
      this.minimizeOperands();
      this.pruneOperands();
      // Try to factor out double negatives
      operand = this.operand();
      if (operand && operand instanceof operationTypes.NotOperation) {
        return this.operands[0].operand;
      }
      else {
        return this;
      }
    };

    this.operand = function () {
      return this.operands.length == 1 && this.operands[0];
    };

    // FIXME: "Defaults to false"?
    this.isNegated = function () {
      var parent = this.parent;
      return !!parent ? parent.isNegated() : true;
    };
  }

, NullOperation: function () {

    // TODO: Make sure it's either a Hash or a Resource
    this.matches = function (resource) {
      return true;
    };

    this.isValid = function () {
      return true;
    };

    this.isNull = function () {
      return true;
    };

  }
};

(function () {
  var ctor;
  for (var t in operationTypes) {
    ctor = operationTypes[t];
    ctor.prototype = new OperationBase();
    ctor.prototype.constructor = ctor;
  }
})();

// Export the specific constructors as well as the `create` function
utils.mixin(operation, operationTypes);
operation.OperationBase = OperationBase;

module.exports = operation;


});

require.define("/node_modules/model/lib/query/comparison.js",function(require,module,exports,__dirname,__filename,process,global){var utils = require('utilities')
  , datatypes = require('../datatypes')
  , comparison = {}
  , ComparisonBase
  , comparisonTypes
  , _validateForDatatype;

_validateForDatatype = function (val) {
  var validator = datatypes[this.datatype].validate
    , validated = validator(this.field, val, {});
  return !validated.err;
};

comparison.create = function () {
  var args = Array.prototype.slice.call(arguments)
    , type = args.shift()
    , ctor = utils.string.capitalize(type) + 'Comparison'
    , inst;

    ctor = comparisonTypes[ctor];
    inst = new ctor();
    inst.type = type;
    inst.initialize.apply(inst, args);
    return inst;
};

ComparisonBase = function () {
  this.initialize = function (field, value, datatype, opts) {
    this.parent = null;
    this.descendants = [];
    this.field = field;
    this.value = value;
    // FIXME: Should use Property objects
    this.datatype = datatype;
    this.opts = opts || {};
  };

  // Most basic validation is to check that the value for the
  // comparison is actually valid for this field
  this.isValid = function () {
    return _validateForDatatype.apply(this, [this.value]);
  };
};

comparisonTypes = {
  EqualToComparison: function () {
    this.jsComparatorString = '==';
    this.sqlComparatorString = '=';
  }

, NotEqualToComparison: function () {
    this.jsComparatorString = '!=';
    this.sqlComparatorString = '!=';
  }

, GreaterThanComparison: function () {
    this.jsComparatorString = '>';
    this.sqlComparatorString = '>';
  }

, LessThanComparison: function () {
    this.jsComparatorString = '<';
    this.sqlComparatorString = '<';
  }

, GreaterThanOrEqualComparison: function () {
    this.jsComparatorString = '>=';
    this.sqlComparatorString = '>=';
  }

, LessThanOrEqualComparison: function () {
    this.jsComparatorString = '<=';
    this.sqlComparatorString = '<=';
  }

, InclusionComparison: function () {
    this.sqlComparatorString = 'IN';

    this.isValid = function () {
      var self = this
        , val = this.value;
      if (!Array.isArray(val)) {
        return false;
      }
      return val.every(function (item) {
        return _validateForDatatype.apply(self, [item]);
      });
    };
  }

, LikeComparison: function () {
    this.sqlComparatorString = 'LIKE';

    this.isValid = function () {
      if (!(this.datatype == 'string' || this.datatype == 'text')) {
        return false;
      }
      return this.constructor.prototype.isValid.call(this);
    };
  }

};

(function () {
  var ctor;
  for (var t in comparisonTypes) {
    ctor = comparisonTypes[t];
    ctor.prototype = new ComparisonBase();
    ctor.prototype.constructor = ctor;
  }
})();

// Export the specific constructors as well as the `create` function
utils.mixin(comparison, comparisonTypes);

module.exports = comparison;



});

require.define("/node_modules/model/lib/datatypes.js",function(require,module,exports,__dirname,__filename,process,global){/*
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

var model = require('./index')
  , utils = require('utilities')
  , i18n = utils.i18n
  , datatypes
  , _isArray
  , _serialize
  , _quoteize
  , _escape
  , _unescape;

_isArray = function (obj) {
  // Defer to native if possible
  if (typeof Array.isArray == 'function') {
    return Array.isArray(obj);
  }
  return obj &&
    typeof obj === 'object' &&
    typeof obj.length === 'number' &&
    typeof obj.splice === 'function' &&
    !(obj.propertyIsEnumerable('length'));
};

_serialize = function (input, options) {
  var val = String(input)
    , opts = options || {};
  if (opts.escape) {
    val = _escape(val);
  }
  if (opts.useQuotes) {
    val = _quoteize(val);
  }
  if (opts.lowercase) {
    val = val.toLowerCase();
  }
  return val;
};

_quoteize = function (val) {
  return ["'", "'"].join(val);
}

// Scrub input for basic SQL injection protection
_escape = function (s) {
  return s.replace(/'/g, "''");
};

tunescape = function (s) {
  return s.replace(/''/g, "'");
};

/*
 * Datatype verification -- may modify the value by casting
 */
datatypes = {

  'string': {
    validate: function (name, val, locale) {
      return {
        err: null
      , val: String(val)
      };
    }
  , serialize: function (input, options) {
      return _serialize(input, options);
    }
  }

, 'text': {
    validate: function (name, val, locale) {
      return {
        err: null
      , val: String(val)
      };
    }
  , serialize: function (input, options) {
      return _serialize(input, options);
    }
  }

, 'number': {
    validate: function (name, val, locale) {
      if (isNaN(val)) {
        return {
          err: i18n.getText('model.validatesNumber', {name: name}, locale)
        , val: null
        };
      }
      return {
        err: null
      , val: Number(val)
      };
    }
  , serialize: function (input, options) {
      var opts = options || {};
      return _serialize(input, {
        escape: opts.escape
      });
    }
  }

, 'int': {
    validate: function (name, val, locale) {
      // Allow decimal values like 10.0 and 3.0
      if (Math.round(val) != val) {
        return {
          err: i18n.getText('model.validatesInteger', {name: name}, locale)
        , val: null
        };
      }
      return {
        err: null
      , val: parseInt(val, 10)
      };
    }
  , serialize: function (input, options) {
      var opts = options || {};
      return _serialize(input, {
        escape: opts.escape
      });
    }
  }

, 'boolean': {
    validate: function (name, val, locale) {
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
      }
      return {
        err: null
        , val: validated
      };
    }
  , serialize: function (input, options) {
      var opts = options || {};
      return _serialize(input, {
        escape: opts.escape
      });
    }
  }

, 'object': {
    validate: function (name, val, locale) {
      // Sure, Arrays are technically Objects, but we're treating Array as a
      // separate datatype. Remember, instanceof Array fails across window
      // boundaries, so let's also make sure the Object isn't Array-ish
      if (typeof val != 'object' || _isArray(val)) {
        return {
          err: i18n.getText('model.validatesObject', {name: name}, locale)
        , val: null
        };
      }
      return {
        err: null
      , val: val
      };
    }
  , serialize: function (input, options) {
      var val
        , opts = options || {};
      if (typeof val.toString == 'function') {
        val = input.toString();
      }
      else {
        val = JSON.stringify(input);
      }
      // FIXME: Does escaping a JSONized object make sense?
      return _serialize(val, opts);
    }
  }

, 'array': {
    validate: function (name, val, locale) {
      // instanceof check can fail across window boundaries. Also check
      // to make sure there's a length property
      if (!_isArray(val)) {
        return {
          err: i18n.getText('model.validatesArray', {name: name}, locale)
        , val: null
        };
      }
      return {
        err: null
      , val: val
      };
    }
  , serialize: function (input, options) {
      var val
        , opts = options || {};
      val = input.toString();
      return _serialize(val, opts);
    }
  }

, 'date': {
    validate: function (name, val, locale) {
      var dt = utils.date.parse(val);
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
    }
  , serialize: function (input, options) {
      var val
        , opts = options || {};
      if (model.useUTC) {
        val = utils.date.toUTC(input);
      }
      else {
        val = input;
      }
      val = utils.date.strftime(val, '%F');
      return _serialize(val, opts);
    }
  }

, 'datetime': {
    validate: function (name, val, locale) {
      var dt = utils.date.parse(val);
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
    }
  , serialize: function (input, options) {
      var val
        , opts = options || {};
      if (model.useUTC) {
        val = utils.date.toUTC(input);
      }
      else {
        val = input;
      }
      val = utils.date.toISO8601(val, {utc: true});
      return _serialize(val, options);
    }
  }

  // This is a hack -- we're saving times as Dates of 12/31/1969, and the
  // desired time
, 'time': {
    validate: function (name, val, locale) {
      var dt = utils.date.parse(val);
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
    }
  , serialize: function (input, options) {
      var val
        , opts = options || {};
      val = utils.date.strftime(val, '%T');
      return _serialize(val, opts);
    }
  }

};

module.exports = datatypes;

// Lazy-load; model loads this file first
model = require('./index');

});

require.define("/node_modules/socket.io-client/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/io.js","browserify":"./dist/socket.io.js"}
});

require.define("/node_modules/socket.io-client/dist/socket.io.js",function(require,module,exports,__dirname,__filename,process,global){/*! Socket.IO.js build:0.9.10, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

var io = ('undefined' === typeof module ? {} : module.exports);
(function() {

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.10';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

   /**
   * Detect iPad/iPhone/iPod.
   *
   * @api public
   */

  util.ua.iDevice = 'undefined' != typeof navigator
      && /iPad|iPhone|iPod/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    if (name === undefined) {
      this.$events = {};
      return this;
    }

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);


  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  Transport.prototype.heartbeats = function () {
    return true;
  }

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.isOpen = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.isOpen) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.isOpen = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.isOpen = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': false
      , 'auto connect': true
      , 'flash policy port': 10843
      , 'manualFlush': false
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;
      io.util.on(global, 'beforeunload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.connecting = false;
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      if (this.isXDomain()) {
        xhr.withCredentials = true;
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else if (xhr.status == 403) {
            self.onError(xhr.responseText);
          } else {
            self.connecting = false;            
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck(this))) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;
    self.connecting = true;
    
    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      if(!self.transports)
          self.transports = self.origTransports = (transports ? io.util.intersect(
              transports.split(',')
            , self.options.transports
          ) : self.options.transports);

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  var remaining = self.transports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);
    if(this.transport && !this.transport.heartbeats()) return;

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      if (!this.options['manualFlush']) {
        this.flushBuffer();
      }
    }
  };

  /**
   * Flushes the buffer data over the wire.
   * To be invoked manually when 'manualFlush' is set to true.
   *
   * @api public
   */

  Socket.prototype.flushBuffer = function() {
    this.transport.payload(this.buffer);
    this.buffer = [];
  };
  

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request();
    var uri = [
        'http' + (this.options.secure ? 's' : '') + ':/'
      , this.options.host + ':' + this.options.port
      , this.options.resource
      , io.protocol
      , ''
      , this.sessionid
    ].join('/') + '/?disconnect=1';

    xhr.open('GET', uri, false);
    xhr.send(null);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transports = self.origTransports;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  // Do to a bug in the current IDevices browser, we need to wrap the send in a 
  // setTimeout, when they resume from sleeping the browser will crash if 
  // we don't allow the browser time to detect the socket has been closed
  if (io.util.ua.iDevice) {
    WS.prototype.send = function (data) {
      var self = this;
      setTimeout(function() {
         self.websocket.send(data);
      },0);
      return this;
    };
  } else {
    WS.prototype.send = function (data) {
      this.websocket.send(data);
      return this;
    };
  }

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.flashsocket = Flashsocket;

  /**
   * The FlashSocket transport. This is a API wrapper for the HTML5 WebSocket
   * specification. It uses a .swf file to communicate with the server. If you want
   * to serve the .swf file from a other server than where the Socket.IO script is
   * coming from you need to use the insecure version of the .swf. More information
   * about this can be found on the github page.
   *
   * @constructor
   * @extends {io.Transport.websocket}
   * @api public
   */

  function Flashsocket () {
    io.Transport.websocket.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(Flashsocket, io.Transport.websocket);

  /**
   * Transport name
   *
   * @api public
   */

  Flashsocket.prototype.name = 'flashsocket';

  /**
   * Disconnect the established `FlashSocket` connection. This is done by adding a 
   * new task to the FlashSocket. The rest will be handled off by the `WebSocket` 
   * transport.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.open = function () {
    var self = this
      , args = arguments;

    WebSocket.__addTask(function () {
      io.Transport.websocket.prototype.open.apply(self, args);
    });
    return this;
  };
  
  /**
   * Sends a message to the Socket.IO server. This is done by adding a new
   * task to the FlashSocket. The rest will be handled off by the `WebSocket` 
   * transport.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.send = function () {
    var self = this, args = arguments;
    WebSocket.__addTask(function () {
      io.Transport.websocket.prototype.send.apply(self, args);
    });
    return this;
  };

  /**
   * Disconnects the established `FlashSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  Flashsocket.prototype.close = function () {
    WebSocket.__tasks.length = 0;
    io.Transport.websocket.prototype.close.call(this);
    return this;
  };

  /**
   * The WebSocket fall back needs to append the flash container to the body
   * element, so we need to make sure we have access to it. Or defer the call
   * until we are sure there is a body element.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Flashsocket.prototype.ready = function (socket, fn) {
    function init () {
      var options = socket.options
        , port = options['flash policy port']
        , path = [
              'http' + (options.secure ? 's' : '') + ':/'
            , options.host + ':' + options.port
            , options.resource
            , 'static/flashsocket'
            , 'WebSocketMain' + (socket.isXDomain() ? 'Insecure' : '') + '.swf'
          ];

      // Only start downloading the swf file when the checked that this browser
      // actually supports it
      if (!Flashsocket.loaded) {
        if (typeof WEB_SOCKET_SWF_LOCATION === 'undefined') {
          // Set the correct file based on the XDomain settings
          WEB_SOCKET_SWF_LOCATION = path.join('/');
        }

        if (port !== 843) {
          WebSocket.loadFlashPolicyFile('xmlsocket://' + options.host + ':' + port);
        }

        WebSocket.__initialize();
        Flashsocket.loaded = true;
      }

      fn.call(self);
    }

    var self = this;
    if (document.body) return init();

    io.util.load(init);
  };

  /**
   * Check if the FlashSocket transport is supported as it requires that the Adobe
   * Flash Player plug-in version `10.0.0` or greater is installed. And also check if
   * the polyfill is correctly loaded.
   *
   * @returns {Boolean}
   * @api public
   */

  Flashsocket.check = function () {
    if (
        typeof WebSocket == 'undefined'
      || !('__initialize' in WebSocket) || !swfobject
    ) return false;

    return swfobject.getFlashPlayerVersion().major >= 10;
  };

  /**
   * Check if the FlashSocket transport can be used as cross domain / cross origin 
   * transport. Because we can't see which type (secure or insecure) of .swf is used
   * we will just return true.
   *
   * @returns {Boolean}
   * @api public
   */

  Flashsocket.xdomainCheck = function () {
    return true;
  };

  /**
   * Disable AUTO_INITIALIZATION
   */

  if (typeof window != 'undefined') {
    WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;
  }

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('flashsocket');
})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
if ('undefined' != typeof window) {
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O[(['Active'].concat('Object').join('X'))]!=D){try{var ad=new window[(['Active'].concat('Object').join('X'))](W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?(['Active'].concat('').join('X')):"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
}
// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
// License: New BSD License
// Reference: http://dev.w3.org/html5/websockets/
// Reference: http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol

(function() {
  
  if ('undefined' == typeof window || window.WebSocket) return;

  var console = window.console;
  if (!console || !console.log || !console.error) {
    console = {log: function(){ }, error: function(){ }};
  }
  
  if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
    console.error("Flash Player >= 10.0.0 is required.");
    return;
  }
  if (location.protocol == "file:") {
    console.error(
      "WARNING: web-socket-js doesn't work in file:///... URL " +
      "unless you set Flash Security Settings properly. " +
      "Open the page via Web server i.e. http://...");
  }

  /**
   * This class represents a faux web socket.
   * @param {string} url
   * @param {array or string} protocols
   * @param {string} proxyHost
   * @param {int} proxyPort
   * @param {string} headers
   */
  WebSocket = function(url, protocols, proxyHost, proxyPort, headers) {
    var self = this;
    self.__id = WebSocket.__nextId++;
    WebSocket.__instances[self.__id] = self;
    self.readyState = WebSocket.CONNECTING;
    self.bufferedAmount = 0;
    self.__events = {};
    if (!protocols) {
      protocols = [];
    } else if (typeof protocols == "string") {
      protocols = [protocols];
    }
    // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
    // Otherwise, when onopen fires immediately, onopen is called before it is set.
    setTimeout(function() {
      WebSocket.__addTask(function() {
        WebSocket.__flash.create(
            self.__id, url, protocols, proxyHost || null, proxyPort || 0, headers || null);
      });
    }, 0);
  };

  /**
   * Send data to the web socket.
   * @param {string} data  The data to send to the socket.
   * @return {boolean}  True for success, false for failure.
   */
  WebSocket.prototype.send = function(data) {
    if (this.readyState == WebSocket.CONNECTING) {
      throw "INVALID_STATE_ERR: Web Socket connection has not been established";
    }
    // We use encodeURIComponent() here, because FABridge doesn't work if
    // the argument includes some characters. We don't use escape() here
    // because of this:
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
    // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
    // preserve all Unicode characters either e.g. "\uffff" in Firefox.
    // Note by wtritch: Hopefully this will not be necessary using ExternalInterface.  Will require
    // additional testing.
    var result = WebSocket.__flash.send(this.__id, encodeURIComponent(data));
    if (result < 0) { // success
      return true;
    } else {
      this.bufferedAmount += result;
      return false;
    }
  };

  /**
   * Close this web socket gracefully.
   */
  WebSocket.prototype.close = function() {
    if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) {
      return;
    }
    this.readyState = WebSocket.CLOSING;
    WebSocket.__flash.close(this.__id);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.addEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) {
      this.__events[type] = [];
    }
    this.__events[type].push(listener);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture
   * @return void
   */
  WebSocket.prototype.removeEventListener = function(type, listener, useCapture) {
    if (!(type in this.__events)) return;
    var events = this.__events[type];
    for (var i = events.length - 1; i >= 0; --i) {
      if (events[i] === listener) {
        events.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {Event} event
   * @return void
   */
  WebSocket.prototype.dispatchEvent = function(event) {
    var events = this.__events[event.type] || [];
    for (var i = 0; i < events.length; ++i) {
      events[i](event);
    }
    var handler = this["on" + event.type];
    if (handler) handler(event);
  };

  /**
   * Handles an event from Flash.
   * @param {Object} flashEvent
   */
  WebSocket.prototype.__handleEvent = function(flashEvent) {
    if ("readyState" in flashEvent) {
      this.readyState = flashEvent.readyState;
    }
    if ("protocol" in flashEvent) {
      this.protocol = flashEvent.protocol;
    }
    
    var jsEvent;
    if (flashEvent.type == "open" || flashEvent.type == "error") {
      jsEvent = this.__createSimpleEvent(flashEvent.type);
    } else if (flashEvent.type == "close") {
      // TODO implement jsEvent.wasClean
      jsEvent = this.__createSimpleEvent("close");
    } else if (flashEvent.type == "message") {
      var data = decodeURIComponent(flashEvent.message);
      jsEvent = this.__createMessageEvent("message", data);
    } else {
      throw "unknown event type: " + flashEvent.type;
    }
    
    this.dispatchEvent(jsEvent);
  };
  
  WebSocket.prototype.__createSimpleEvent = function(type) {
    if (document.createEvent && window.Event) {
      var event = document.createEvent("Event");
      event.initEvent(type, false, false);
      return event;
    } else {
      return {type: type, bubbles: false, cancelable: false};
    }
  };
  
  WebSocket.prototype.__createMessageEvent = function(type, data) {
    if (document.createEvent && window.MessageEvent && !window.opera) {
      var event = document.createEvent("MessageEvent");
      event.initMessageEvent("message", false, false, data, null, null, window, null);
      return event;
    } else {
      // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
      return {type: type, data: data, bubbles: false, cancelable: false};
    }
  };
  
  /**
   * Define the WebSocket readyState enumeration.
   */
  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;

  WebSocket.__flash = null;
  WebSocket.__instances = {};
  WebSocket.__tasks = [];
  WebSocket.__nextId = 0;
  
  /**
   * Load a new flash security policy file.
   * @param {string} url
   */
  WebSocket.loadFlashPolicyFile = function(url){
    WebSocket.__addTask(function() {
      WebSocket.__flash.loadManualPolicyFile(url);
    });
  };

  /**
   * Loads WebSocketMain.swf and creates WebSocketMain object in Flash.
   */
  WebSocket.__initialize = function() {
    if (WebSocket.__flash) return;
    
    if (WebSocket.__swfLocation) {
      // For backword compatibility.
      window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
    }
    if (!window.WEB_SOCKET_SWF_LOCATION) {
      console.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
      return;
    }
    var container = document.createElement("div");
    container.id = "webSocketContainer";
    // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
    // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
    // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
    // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
    // the best we can do as far as we know now.
    container.style.position = "absolute";
    if (WebSocket.__isFlashLite()) {
      container.style.left = "0px";
      container.style.top = "0px";
    } else {
      container.style.left = "-100px";
      container.style.top = "-100px";
    }
    var holder = document.createElement("div");
    holder.id = "webSocketFlash";
    container.appendChild(holder);
    document.body.appendChild(container);
    // See this article for hasPriority:
    // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
    swfobject.embedSWF(
      WEB_SOCKET_SWF_LOCATION,
      "webSocketFlash",
      "1" /* width */,
      "1" /* height */,
      "10.0.0" /* SWF version */,
      null,
      null,
      {hasPriority: true, swliveconnect : true, allowScriptAccess: "always"},
      null,
      function(e) {
        if (!e.success) {
          console.error("[WebSocket] swfobject.embedSWF failed");
        }
      });
  };
  
  /**
   * Called by Flash to notify JS that it's fully loaded and ready
   * for communication.
   */
  WebSocket.__onFlashInitialized = function() {
    // We need to set a timeout here to avoid round-trip calls
    // to flash during the initialization process.
    setTimeout(function() {
      WebSocket.__flash = document.getElementById("webSocketFlash");
      WebSocket.__flash.setCallerUrl(location.href);
      WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
      for (var i = 0; i < WebSocket.__tasks.length; ++i) {
        WebSocket.__tasks[i]();
      }
      WebSocket.__tasks = [];
    }, 0);
  };
  
  /**
   * Called by Flash to notify WebSockets events are fired.
   */
  WebSocket.__onFlashEvent = function() {
    setTimeout(function() {
      try {
        // Gets events using receiveEvents() instead of getting it from event object
        // of Flash event. This is to make sure to keep message order.
        // It seems sometimes Flash events don't arrive in the same order as they are sent.
        var events = WebSocket.__flash.receiveEvents();
        for (var i = 0; i < events.length; ++i) {
          WebSocket.__instances[events[i].webSocketId].__handleEvent(events[i]);
        }
      } catch (e) {
        console.error(e);
      }
    }, 0);
    return true;
  };
  
  // Called by Flash.
  WebSocket.__log = function(message) {
    console.log(decodeURIComponent(message));
  };
  
  // Called by Flash.
  WebSocket.__error = function(message) {
    console.error(decodeURIComponent(message));
  };
  
  WebSocket.__addTask = function(task) {
    if (WebSocket.__flash) {
      task();
    } else {
      WebSocket.__tasks.push(task);
    }
  };
  
  /**
   * Test if the browser is running flash lite.
   * @return {boolean} True if flash lite is running, false otherwise.
   */
  WebSocket.__isFlashLite = function() {
    if (!window.navigator || !window.navigator.mimeTypes) {
      return false;
    }
    var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
    if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) {
      return false;
    }
    return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
  };
  
  if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
    if (window.addEventListener) {
      window.addEventListener("load", function(){
        WebSocket.__initialize();
      }, false);
    } else {
      window.attachEvent("onload", function(){
        WebSocket.__initialize();
      });
    }
  }
  
})();

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function (socket) {
    return XHR.check(socket, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.htmlfile = HTMLFile;

  /**
   * The HTMLFile transport creates a `forever iframe` based transport
   * for Internet Explorer. Regular forever iframe implementations will 
   * continuously trigger the browsers buzy indicators. If the forever iframe
   * is created inside a `htmlfile` these indicators will not be trigged.
   *
   * @constructor
   * @extends {io.Transport.XHR}
   * @api public
   */

  function HTMLFile (socket) {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(HTMLFile, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  HTMLFile.prototype.name = 'htmlfile';

  /**
   * Creates a new Ac...eX `htmlfile` with a forever loading iframe
   * that can be used to listen to messages. Inside the generated
   * `htmlfile` a reference will be made to the HTMLFile transport.
   *
   * @api private
   */

  HTMLFile.prototype.get = function () {
    this.doc = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
    this.doc.open();
    this.doc.write('<html></html>');
    this.doc.close();
    this.doc.parentWindow.s = this;

    var iframeC = this.doc.createElement('div');
    iframeC.className = 'socketio';

    this.doc.body.appendChild(iframeC);
    this.iframe = this.doc.createElement('iframe');

    iframeC.appendChild(this.iframe);

    var self = this
      , query = io.util.query(this.socket.options.query, 't='+ +new Date);

    this.iframe.src = this.prepareUrl() + query;

    io.util.on(window, 'unload', function () {
      self.destroy();
    });
  };

  /**
   * The Socket.IO server will write script tags inside the forever
   * iframe, this function will be used as callback for the incoming
   * information.
   *
   * @param {String} data The message
   * @param {document} doc Reference to the context
   * @api private
   */

  HTMLFile.prototype._ = function (data, doc) {
    this.onData(data);
    try {
      var script = doc.getElementsByTagName('script')[0];
      script.parentNode.removeChild(script);
    } catch (e) { }
  };

  /**
   * Destroy the established connection, iframe and `htmlfile`.
   * And calls the `CollectGarbage` function of Internet Explorer
   * to release the memory.
   *
   * @api private
   */

  HTMLFile.prototype.destroy = function () {
    if (this.iframe){
      try {
        this.iframe.src = 'about:blank';
      } catch(e){}

      this.doc = null;
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;

      CollectGarbage();
    }
  };

  /**
   * Disconnects the established connection.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  HTMLFile.prototype.close = function () {
    this.destroy();
    return io.Transport.XHR.prototype.close.call(this);
  };

  /**
   * Checks if the browser supports this transport. The browser
   * must have an `Ac...eXObject` implementation.
   *
   * @return {Boolean}
   * @api public
   */

  HTMLFile.check = function (socket) {
    if (typeof window != "undefined" && (['Active'].concat('Object').join('X')) in window){
      try {
        var a = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
        return a && io.Transport.XHR.check(socket);
      } catch(e){}
    }
    return false;
  };

  /**
   * Check if cross domain requests are supported.
   *
   * @returns {Boolean}
   * @api public
   */

  HTMLFile.xdomainCheck = function () {
    // we can probably do handling for sub-domains, we should
    // test that it's cross domain but a subdomain here
    return false;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('htmlfile');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  XHRPolling.prototype.heartbeats = function () {
    return false;
  };

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.isOpen) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {
  /**
   * There is a way to hide the loading indicator in Firefox. If you create and
   * remove a iframe it will stop showing the current loading indicator.
   * Unfortunately we can't feature detect that and UA sniffing is evil.
   *
   * @api private
   */

  var indicator = global.document && "MozAppearance" in
    global.document.documentElement.style;

  /**
   * Expose constructor.
   */

  exports['jsonp-polling'] = JSONPPolling;

  /**
   * The JSONP transport creates an persistent connection by dynamically
   * inserting a script tag in the page. This script tag will receive the
   * information of the Socket.IO server. When new information is received
   * it creates a new script tag for the new data stream.
   *
   * @constructor
   * @extends {io.Transport.xhr-polling}
   * @api public
   */

  function JSONPPolling (socket) {
    io.Transport['xhr-polling'].apply(this, arguments);

    this.index = io.j.length;

    var self = this;

    io.j.push(function (msg) {
      self._(msg);
    });
  };

  /**
   * Inherits from XHR polling transport.
   */

  io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);

  /**
   * Transport name
   *
   * @api public
   */

  JSONPPolling.prototype.name = 'jsonp-polling';

  /**
   * Posts a encoded message to the Socket.IO server using an iframe.
   * The iframe is used because script tags can create POST based requests.
   * The iframe is positioned outside of the view so the user does not
   * notice it's existence.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  JSONPPolling.prototype.post = function (data) {
    var self = this
      , query = io.util.query(
             this.socket.options.query
          , 't='+ (+new Date) + '&i=' + this.index
        );

    if (!this.form) {
      var form = document.createElement('form')
        , area = document.createElement('textarea')
        , id = this.iframeId = 'socketio_iframe_' + this.index
        , iframe;

      form.className = 'socketio';
      form.style.position = 'absolute';
      form.style.top = '0px';
      form.style.left = '0px';
      form.style.display = 'none';
      form.target = id;
      form.method = 'POST';
      form.setAttribute('accept-charset', 'utf-8');
      area.name = 'd';
      form.appendChild(area);
      document.body.appendChild(form);

      this.form = form;
      this.area = area;
    }

    this.form.action = this.prepareUrl() + query;

    function complete () {
      initIframe();
      self.socket.setBuffer(false);
    };

    function initIframe () {
      if (self.iframe) {
        self.form.removeChild(self.iframe);
      }

      try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = document.createElement('<iframe name="'+ self.iframeId +'">');
      } catch (e) {
        iframe = document.createElement('iframe');
        iframe.name = self.iframeId;
      }

      iframe.id = self.iframeId;

      self.form.appendChild(iframe);
      self.iframe = iframe;
    };

    initIframe();

    // we temporarily stringify until we figure out how to prevent
    // browsers from turning `\n` into `\r\n` in form inputs
    this.area.value = io.JSON.stringify(data);

    try {
      this.form.submit();
    } catch(e) {}

    if (this.iframe.attachEvent) {
      iframe.onreadystatechange = function () {
        if (self.iframe.readyState == 'complete') {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }

    this.socket.setBuffer(true);
  };
  
  /**
   * Creates a new JSONP poll that can be used to listen
   * for messages from the Socket.IO server.
   *
   * @api private
   */

  JSONPPolling.prototype.get = function () {
    var self = this
      , script = document.createElement('script')
      , query = io.util.query(
             this.socket.options.query
          , 't='+ (+new Date) + '&i=' + this.index
        );

    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    script.async = true;
    script.src = this.prepareUrl() + query;
    script.onerror = function () {
      self.onClose();
    };

    var insertAt = document.getElementsByTagName('script')[0]
    insertAt.parentNode.insertBefore(script, insertAt);
    this.script = script;

    if (indicator) {
      setTimeout(function () {
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  };

  /**
   * Callback function for the incoming message stream from the Socket.IO server.
   *
   * @param {String} data The message
   * @api private
   */

  JSONPPolling.prototype._ = function (msg) {
    this.onData(msg);
    if (this.isOpen) {
      this.get();
    }
    return this;
  };

  /**
   * The indicator hack only works after onload
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  JSONPPolling.prototype.ready = function (socket, fn) {
    var self = this;
    if (!indicator) return fn.call(this);

    io.util.load(function () {
      fn.call(self);
    });
  };

  /**
   * Checks if browser supports this transport.
   *
   * @return {Boolean}
   * @api public
   */

  JSONPPolling.check = function () {
    return 'document' in global;
  };

  /**
   * Check if cross domain requests are supported
   *
   * @returns {Boolean}
   * @api public
   */

  JSONPPolling.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('jsonp-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

})();
});

require.define("/templates/build/build.js",function(require,module,exports,__dirname,__filename,process,global){window.geddy = {}

// require model
geddy.model = require('model');

// mix utilities into geddy
var utilities = require('utilities');
utilities.mixin(geddy, utilities);

// require socket.io-client
geddy.io = require('socket.io-client');
geddy.socket = geddy.io.connect('/');

geddy.io.listenForModelEvents = function (model) {
  var events = [
    'save'
  , 'update'
  , 'remove'
  ];

  for (var e in events) {
    (function (event) {
      geddy.socket.on(model.modelName + ':' + event, function (data) {
        var instance;
        if (typeof data != 'string') {
          instance = model.create(data);
        }
        else {
         instance = data;
        }
        if (geddy.debug == true) {
          console.log(event, instance);
        }
        model.emit(event, instance);
      });
    })(events[e]);
  };
}

geddy.io.addListenersForModels = function (models) {
  for (var i in models) {
    (function (model) {
      geddy.io.listenForModelEvents(model);
    })(geddy.model[models[i]]);
  }
}




});
require("/templates/build/build.js");
})();
