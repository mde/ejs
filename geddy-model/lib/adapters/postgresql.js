var sys = require('sys');
var postgres;

try {
  postgres = require('node_postgres/postgres');
}
catch (e) {
  throw new Error('Postgres adapter requires node_postgres, http://github.com/ry/node_postgres');
}

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

var SQLBaseAdapter = require('geddy-model/lib/adapters/sql_base').SQLBaseAdapter;
var adapter = new SQLBaseAdapter(conn);

module.exports = adapter;

