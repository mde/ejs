if (geddy.config.environment == 'development') {
  console.warn('Creating CouchDB client for DB adapter, connecting ...');
}

var Client = require('geddy-core/lib/clients/couchdb').Client
  , client
  , postData;

client = new Client(
  geddy.config.database.hostname,
  geddy.config.database.port,
  geddy.config.database.dbName);

// Try to connect to the database, make sure it's there
client.request({url: '/', method: 'GET'}, function (resp) {
      if (resp.statusCode == 404) {
        throw new Error(geddy.config.database.dbName +
            ' not found. Set up your DB with geddy-gen db:create.');
      }
    }
);

// Create the by-type and by-id views -- ignore conflicts,
// this means they're already there
postData = {"_id": "_design/type", "views": {"all":
    {"map": "function(doc){ if (doc.type) { emit(doc.type, doc) }}"}}};
client.request({url: '/_design/type', method: 'PUT',
    data: postData}, function (resp) {
    }
);
postData = {"_id": "_design/id", "views": {"all":
    {"map": "function(doc){ if (doc.id) { emit(doc.id, doc) }}"}}};
client.request({url: '/_design/id', method: 'PUT',
    data: postData}, function (resp) {
    }
);

var adapter = new function () {
  var _rows;
  var _map;
  var _include;
  var _callback;

  var _matched = function (data, conditions) {
    for (var p in conditions) {
      if (data[p] == conditions[p]) {
        return true;
      }
    }
    return false;
  };

  // Scrub input for basic SQL injection protection
  var _escape = function (s) {
    return s.replace(/'/g, "\'\'\'\'");
  };

  var _unescape = function (s) {
    return s.replace(/''/g, "\'");
  };

  this.save = function (modelItem, callback) {
    // Update track
    if (modelItem.saved) {
      uuid = modelItem.id;
    }
    // Create track
    else {
      // Responsibilities of the adapter include:
      // 1. Setting the UUID on the item if there's not one already explicitly set
      // 2. setting the saved flag before saving
      uuid = geddy.util.string.uuid();
      modelItem.id = modelItem.id || uuid;
      modelItem.saved = true;
    }
    
    client.request({url: '/' + uuid, method: 'PUT',
        data: modelItem}, function (response) {
      if (response.statusCode == 201) {
        var url = response.url;
        var data = JSON.parse(response.body);
        // Avoid another round-trip just to get _id and _rev
        modelItem._id = data.id;
        modelItem._rev = data.rev;
        callback(null, modelItem);
      }
      else {
        callback(Error('could not create CouchDB item.'), null);
      }
    });
  };

  this.remove = function (dataType, uuidParam, callback) {
    // Fetch the current revision -- deletes are considered
    // modifications
    client.request({url: '/_all_docs', method: 'POST',
        data: {keys: [uuidParam]}}, function (response) {
          var body = JSON.parse(response.body);
          var rows = body.rows;
          var item = rows[0];
          var rev = item.value.rev;
          // Okay, now we have the rev number -- we can delete this
          // bitch
          client.request({url: '/' + uuidParam + '?rev=' + rev, 
              method: 'DELETE'}, function (response) {
                callback(null, null);
              }
          );
        }
    );

  };

  var _fetchItems = function (params, base) {
    var ids
      , buildItemsFunc = function (resp) {
        _buildItems(resp, params);
    };
    // All of a given datatype
    if (!params.ids || params.ids[0] == 'all') {
      client.request({url: '/_design/type/_view/all?key=%22' +
          _escape(params.dataType) + '%22',
          method: 'GET'}, buildItemsFunc);
    }
    // By id
    else {
      ids = params.ids;
      for (var i = 0, ii = ids.length; i < ii; i++) {
        ids[i] = _escape(ids[i]);
      }
      client.request({url: '/_design/id/_view/all', method: 'POST',
          data: {keys: ids}}, buildItemsFunc);
    }

  };

  var _buildItems = function (resp, params) {
    var body = JSON.parse(resp.body);
    var rows = body.rows;
    var data, parsed, resp = [];
    // Create typed objects
    for (var i = 0, ii = rows.length; i < ii; i++) {
      // Row item will contain key and value/error
      data = rows[i].value;
      if (data) {
        parsed = GLOBAL[data.type].create(data);
        
        if (!params.conditions || _matched(parsed, params.conditions)) {
          // Add Couch-specific stuff to allow updates
          parsed._id = data._id;
          parsed._rev = data._rev;

          resp.push(parsed);
        }
      }
    }
    _callback(null, resp);
  };

  this.find = function (dataType, uuidParam, callback) {
    _rows = [];
    _map = {};
    _callback = callback;

    uuids = typeof uuidParam == 'string' ? [uuidParam] : uuidParam;

    this.all(dataType, {ids: uuids}, callback);
  };

  this.all = function () {
    var args = Array.prototype.slice.call(arguments);
    // Datatype is first arg
    var dataType = args.shift();
    // Callback is last arg
    var callback = args.pop();
    // Optional filtering opts
    var params = args.shift() || {};
    var include, key;

    _rows = [];
    _map = {};
    _include = {};
    _callback = callback;

    params.dataType = dataType;

    include = params.include;
    if (include) {
      include = typeof include == 'string' ? [include] : include;
      for (var i = 0, ii = include.length; i < ii; i++) {
        key = include[i];
        key = geddy.inflections[key].constructor.plural;
        _include[key] = true;
      }
    }

    _fetchItems(params, true);
  };

  this.update = function (dataType, uuidParam, params, callback) {
    this.find(dataType, uuidParam, function (err, items) {
      if (err) { throw err; }
      var item = items[0];
      item.updateAttributes(params, callback);
    });
  };

}();

module.exports = adapter;

