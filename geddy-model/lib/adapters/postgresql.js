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

  this.save = function (modelItem, callback) {
    var uuid;
    var item;
    if (modelItem.id) {
      uuid = util.string.uuid();
      modelItem.id = uuid;
      item = JSON.stringify(modelItem);
      sql = "INSERT INTO geddy_data (uuid, data) VALUES ('" +
          uuid + "', '" + item + "');"
    }
    else {
      uuid = item.id;
      item = JSON.stringify(modelItem);
      sql = "UPDATE geddy_data SET data = '" +
          item + "' WHERE uuid = '" + uuid + "';"

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

  this.load = function (dataType, refiner, callback) {
    var uuid = refiner.id;
    conn.query("SELECT data FROM geddy_data WHERE uuid = '" +
        uuid + "';", function (err, rows) {
        data = rows[0].data;
        data = JSON.parse(data);
        uuid = data.id;
        data = GLOBAL[dataType].create(data);
        data.id = uuid;
        callback(err, data);
    });

  };

}();

for (var p in adapter) { this[p] = adapter[p]; }

