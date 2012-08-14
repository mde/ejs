var file = require('utilities').file
  , riak = file.requireLocal('riak-js');

 //require('riak-js').getClient()

var Riak = function (config) {
  var _config = {
    host: 'localhost'
  , port: '8098'
  , username: null
  , password: null
  };

  if (!geddy.config.db.riak) {
    throw "No Riak config defined.";
  }

  geddy.mixin(_config, config);

  // Model string
  this.model = config.model;

  // Connect to the DB
  this.db = riak.getClient(_config);

  geddy.mixin(this, _config);

  // Calling signature can be:
  // callback
  // query, callback
  // query, opts, callback
  this.load = function () {
    var self = this
      , args = Array.prototype.slice.call(arguments)
      , arg
      , callback = args.pop()
      , query = args.shift() || {}
      , opts = args.shift() || {};

    if (typeof query == 'object') {
      //opts.limit = 1; Why?
      return this.all(query, opts, callback);
    }
    else {
      return this.all({id: query}, opts, callback);
    }

  };

  this.all = function () {
    var self = this
      , args = Array.prototype.slice.call(arguments)
      , callback = args.pop()
      , query = args.shift() || {}
      , opts = args.shift() || {}
      , handler;

    handler = function (err, res) {
      var data;
      // When there's an err, it's also returned as the
      // result, WTF
      if (!err && res) {
        if (Array.isArray(res)) {
          data = [];
          res.forEach(function (doc) {
            data.push(geddy.model[self.model].create(doc.data));
          });
        }
        else {
          data = geddy.model[self.model].create(res);
        }
      }
      return callback(err, data);
    };

    if (query.id) {
      this.db.get(this.model, query.id, opts, handler);
    }
    else {
      opts.where = query;
      this.db.getAll(this.model, opts, handler);
    }

  };

  this.save = function (inst, options, cb) {
    var self = this
      , instance = inst.toObj() // Strip function-props
      , callback = cb || function () {}
      , handler;

    handler = function (err, doc, meta) {
      if (err) {
        instance = null;
      }
      return callback(err, instance);
    };

    // Double check to see if this thing is valid
    instance = geddy.model[this.model].create(instance);
    if (!instance.isValid()) {
      callback(instance.errors, null);
    }
    else {
      instance.id = geddy.string.uuid();
      instance.saved = true;
      this.db.save(this.model, instance.id, instance, {}, handler);
    }
  };

  // Remove a specific instance by id
  this.remove = function (id, opts, callback) {
    var self = this
      , args = Array.prototype.slice.call(arguments)
      , callback = args.pop()
      , id = args.shift() || {}
      , opts = args.shift() || {}
      , handler;

    handler = function (err, data) {
      return callback(err, data);
    };

    this.db.remove(this.model, id, {}, handler);
  };

};

exports.Riak = Riak;

