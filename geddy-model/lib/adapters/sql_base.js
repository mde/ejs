var sys = require('sys');

var SQLBaseAdapter = function (conn) {
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
    var uuid;
    var item;
    var fields = {};
    var keys = [];
    var vals = [];
    var sql = '';

    // Update track
    if (modelItem.saved) {
      uuid = modelItem.id;
      item = JSON.stringify(modelItem);

      fields = {
        updated_at: JSON.stringify(modelItem.updatedAt)
        , data: item
      };
      for (var p in fields) {
        vals.push(_escape(p) + " = '" + _escape(fields[p]) + "'");
      }

      sql += 'UPDATE geddy_data SET';
      sql += ' ' + vals.join(', ');
      sql += " WHERE uuid = '" + _escape(uuid) + "';";
    }
    // Create track
    else {
      // Responsibilities of the adapter include:
      // 1. Setting the UUID on the item
      // 2. setting the saved flag before saving
      uuid = geddy.util.string.uuid();
      modelItem.id = uuid;
      modelItem.saved = true;

      // Serialize item after setting saved flag
      item = JSON.stringify(modelItem);

      fields = {
        uuid: uuid
        , type: modelItem.type
        , created_at: JSON.stringify(modelItem.createdAt)
        , data: item
      };
      for (var p in fields) {
        keys.push(_escape(p));
        vals.push("'" + _escape(fields[p]) + "'");
      }

      sql += 'INSERT INTO geddy_data';
      sql += ' (' + keys.join(', ') + ')';
      sql += ' VALUES';
      sql += ' (' + vals.join(', ') + ');';
    }

    conn.query(sql, function (err, rows) {
        callback(err, modelItem);
    });
  };

  this.remove = function (dataType, uuidParam, callback) {
    uuids = typeof uuidParam == 'string' ? [uuidParam] : uuidParam;
    for (var i = 0, ii = uuids.length; i < ii; i++) {
      uuids[i] = _escape(uuids[i]);
    }
    uuids = "'" + uuids.join("', '") + "'";
    sql = "DELETE FROM geddy_data WHERE uuid in (" + uuids + ");";
    conn.query(sql, function (err, rows) {
        callback(err, rows);
    });
  };

  var _fetchItems = function (params, base) {
    var sql, ids, uuids;

    if (!params.ids || params.ids[0] == 'all') {
      sql = "SELECT data FROM geddy_data WHERE type = '" + _escape(params.dataType) + "';";
    }
    else {
      ids = params.ids;
      for (var i = 0, ii = ids.length; i < ii; i++) {
        ids[i] = _escape(ids[i]);
      }
      uuids = "'" + ids.join("', '") + "'";
      sql = "SELECT data FROM geddy_data WHERE uuid in (" + uuids + ");";
    }

    conn.query(sql, function (err, rows) {
      if (err) {
        throw err;
      }
      else if (!rows) {
        throw new Error('No data returned from SQL query');  
      }
      
      var i, ii, j, jj, p,
          rowData,
          data,
          many, 
          manyIds = [],
          belongs,
          key,
          items,
          item, 
          manyData,
          type = '',
          include;
      
      for (i = 0, ii = rows.length; i < ii; i++) {
        rowData = rows[i].data || rows[i][0];
        rowData = _unescape(rowData);
        data = JSON.parse(rowData);
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
              type = geddy.inflections[p].constructor.plural;
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
          type = geddy.inflections[data.type].constructor.plural;
          for (p in belongs) {
            items = belongs[p].ids;
            for (j = 0, jj = items.length; j < jj; j++) {
              key = items[j];
              item = _map[key];
              if (item) {
                manyData = item.associations.hasMany[type].data || [];
                manyData.push(data);
                item.associations.hasMany[type].data = manyData;
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
        // TODO: Use for identity list for possible DM pattern
        _map = null;
        process.nextTick(function () {
          _callback(null, _rows);
        });
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

};

exports.SQLBaseAdapter = SQLBaseAdapter;


