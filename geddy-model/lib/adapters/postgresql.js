// Expects node_postgres in the lib/ dir of the running app
var postgres = require('node_postgres/postgres');
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
  sys.puts("connected");
  sys.puts(conn.readyState);
});
*/

var adapter = new function () {
  var _rows;
  var _map;
  var _callback;
  
  this.save = function (modelItem, callback) {
    var uuid;
    var item;
    if (modelItem.saved) {
      uuid = modelItem.id;
      item = JSON.stringify(modelItem);
      sql = "UPDATE geddy_data SET data = '" +
          item + "' WHERE uuid = '" + uuid + "';"
    }
    else {
      uuid = util.string.uuid();
      modelItem.id = uuid;
      modelItem.saved = true;
      item = JSON.stringify(modelItem);
      sql = "INSERT INTO geddy_data (uuid, type, data) VALUES ('" +
          uuid + "', '" + modelItem.type + "', '" + item + "');"
    }
    conn.query(sql, function (err, rows) {
        callback(err, modelItem);  
    });
  };

  this.remove = function (modelItem, callback) {
    conn.query("DELETE FROM geddy_data WHERE uuid = '" +
        uuid + "';", function (err, rows) {
        callback(err, rows);
    });
  };
  
  this.all = function (dataType, callback) {
    this.load(dataType, {all: true}, callback);
  };

  this.fetchItems = function (ids, base) {
    var uuids = "'" + ids.join("', '") + "'";
    var sql = "SELECT data FROM geddy_data WHERE uuid in (" + uuids + ")";
    var many, manyIds = [];
    var belongs;
    var key;
    var items, item, manyData;
    var type = '';
    var _this = this;
    conn.query(sql, function (err, rows) {
      if (err) throw err;
      for (var i = 0, ii = rows.length; i < ii; i++) {
        data = rows[i].data;
        data = JSON.parse(data);
        data = GLOBAL[data.type].create(data);
        _map[data.id] = data;
        if (base) {
          _rows.push(data);
        }
        // Pull out ids for any items this item owns
        many = data.associations.hasMany;
        if (many) {
          for (p in many) {
            items = many[p].ids;
            for (var j = 0, jj = items.length; j < jj; j++) {
            manyIds = manyIds.concat(items[j]);
            }
          }
        }
        // Attach this item to any it belongs to in the
        // current dataset
        belongs = data.associations.belongsTo;
        if (belongs) {
          type = inflections[data.type].constructor.plural;
          for (var p in belongs) {
            items = belongs[p].ids;
            for (var j = 0, jj = items.length; j < jj; j++) {
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
        _this.fetchItems(manyIds);
      }
      else {
        _map = null;
        _callback(null, _rows);
      }
    });

  };

  this.load = function (dataType, refiner, callback) {
    
    _rows = [];
    _map = {};
    _callback = callback;
    
    var uuids = refiner.id;
    uuids = typeof uuids == 'string' ? [uuids] : uuids;

    this.fetchItems(uuids, true);
  };

}();

for (var p in adapter) { this[p] = adapter[p]; }

