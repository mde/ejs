var sys = require('sys');
var sqlite;

try {
  sqlite = require('node-sqlite/sqlite');
}
catch (e) {
  throw new Error('SQLite adapter requires node-sqlite, http://github.com/grumdrig/node-sqlite');
}

var db = sqlite.openDatabaseSync(config.database.dbName + '.db');
// Wrap the SQLite query function to use the standard idiom of
// callback(err, data) for Node
var conn = new function () {
  this.query = function () {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    var wrappedCallback = function (rows) {
      callback(null, rows);
    };
    args.push(wrappedCallback);
    try {
      return db.query.apply(db, args);
    }
    catch (e) {
      callback(e, null);
    }
  };
}();

var SQLBaseAdapter = require('geddy-model/lib/adapters/sql_base').SQLBaseAdapter;
var adapter = new SQLBaseAdapter(conn);

module.exports = adapter;


