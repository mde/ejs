
try {
  // Expects node_postgres in the lib/ dir of the running app
  var postgres = require('node_postgres/postgres');
}
catch (e) {
  // createdb -U postgres geddy_db
  // CREATE TABLE geddy_data (uuid VARCHAR(255), type VARCHAR(255), created_at TIMESTAMP, updated_at TIMESTAMP, data TEXT);
  throw new Error('Postgres adapter requires node_postgres, http://github.com/ry/node_postgres, in lib/');
}

var sys = require('sys');

var cfg = config.database;
var conn = postgres.createConnection(
    "  host='" + cfg.hostname +
    "' dbname='" + cfg.dbName +
    "' user='" + cfg.username +
    "' password='" + cfg.password +
    "'");

/*
conn.addListener("connect", function () {
  sys.puts(conn.readyState);
});
*/

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
  }

  this.save = function (modelItem, callback) {
    var uuid;
    var item;
    if (modelItem.saved) {
      uuid = modelItem.id;
      item = JSON.stringify(modelItem);
      sql = "UPDATE geddy_data SET updated_at = now(), data = '" +
          item + "' WHERE uuid = '" + uuid + "';"
    }
    else {
      uuid = util.string.uuid();
      modelItem.id = uuid;
      modelItem.saved = true;
      item = JSON.stringify(modelItem);
      sql = "INSERT INTO geddy_data (uuid, type, created_at, data) VALUES ('" +
          uuid + "', '" + modelItem.type + "', now(), '" + item + "');"
    }
    conn.query(sql, function (err, rows) {
        callback(err, modelItem);
    });
  };

  this.remove = function (dataType, uuidParam, callback) {
    uuids = typeof uuidParam == 'string' ? [uuidParam] : uuidParam;
    uuids = "'" + uuids.join("', '") + "'";
    sql = "DELETE FROM geddy_data WHERE uuid in (" + uuids + ");";
    conn.query(sql, function (err, rows) {
        callback(err, rows);
    });
  };

  var _fetchItems = function (params, base) {

    var i, ii;
    var j, jj;
    var p;
    var sql;
    var uuids;
    var many, manyIds = [];
    var belongs;
    var key;
    var items, item, manyData;
    var type = '';
    var include;

    if(!params.ids || params.ids[0] == 'all') {
      sql = "SELECT data FROM geddy_data WHERE type = '" + params.dataType + "';";
    }
    else {
      uuids = "'" + params.ids.join("', '") + "'";
      sql = "SELECT data FROM geddy_data WHERE uuid in (" + uuids + ");";
    }

    conn.query(sql, function (err, rows) {
      if (err) throw err;
      for (i = 0, ii = rows.length; i < ii; i++) {
        data = rows[i].data;
        data = JSON.parse(data);
        data = GLOBAL[data.type].create(data);

        if (!params.conditions || _matched(data, params.conditions)) {

          _map[data.id] = data;

          if (base) {
            _rows.push(data);
          }
          
          // Pull out ids for any items this item owns
          many = data.associations && data.associations.hasMany;
          if (many) {
            for (p in many) {
              type = inflections[p].constructor.plural;
              // Only do eager fetch if in params.include
              include = _include[type];
              if (include) {
                items = many[p].ids;
                if (items && items.length) {
                  manyIds = manyIds.concat(items.slice());
                }
              }
            }
          }
        }

        // Attach this item to any it belongs to in the
        // current dataset
        belongs = data.assocations && data.associations.belongsTo;
        if (belongs) {
          type = inflections[data.type].constructor.plural;
          for (p in belongs) {
            items = belongs[p].ids;
            for (j = 0, jj = items.length; j < jj; j++) {
              key = items[j];
              item = _map[key];
              if (item) {
                manyData = item.associations.hasMany[type].data || [];
                manyData.push(data);
                item.associations.hasMany[type].data = manyData
              }
            }
          }
        }
      }

      if (manyIds.length) {
        process.nextTick(function () {
          _fetchItems({ids: manyIds});
        });
      }
      else {
        _map = null;
        _callback(null, _rows);
      }
    });

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
    var callback = args.pop();
    var dataType = args.shift();
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
        key = inflections[key].constructor.plural;
        _include[key] = true;
      }
    }

    _fetchItems(params, true);
  };

  this.update = function (dataType, uuidParam, params, callback) {
    this.find(dataType, uuidParam, function (err, items) {
      if (err) throw err;
      var item = items[0];
      item.updateAttributes(params, callback);
    });
  };

}();

for (var p in adapter) { this[p] = adapter[p]; }

