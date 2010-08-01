var http = require("http");

var couchdb = {};

couchdb.Client = function (h, p, n) {
  this.hostname = h || 'localhost';
  this.port = p || 5984;
  this.dbName = n || null;
  this.client = http.createClient(this.port, this.hostname);
};

couchdb.Client.prototype = new function () {
  this.createDocument = function (uuid, item, callback) {
    this.request({url: '/' + this.dbName +
        '/' + uuid, method: 'PUT', data: item}, function (response) {
      if (response.statusCode == 201) {
        var url = response.url;
        var data = JSON.parse(response.body);
        // Avoid another round-trip just to get _id and _rev
        item.rev = data.rev;
        callback(null, item);
      }
      else {
        callback(Error('could not create CouchDB item.'), null);
      }
    });
  };

  this.request = function (params, callback) {
    var req = {}
      , headers
      , request;
    // DB name can be set for the adapter, or passed in on the params,
    // or might even be empty
    var dbName = params.dbName || this.dbName || '';
    req.method = params.method || 'GET';
    req.data = JSON.stringify(params.data) || null;
    req.url = '/' + dbName + '/' + params.url;
    
    headers = {host: this.hostname};
    if (req.data) {
      headers['content-length'] = req.data.length;
    }
    
    request = this.client.request(req.method, req.url, headers);
    request.addListener('response', function (response) {
      response.setEncoding("utf8");
      var resp = '';
      response.addListener("data", function (chunk) {
        resp += chunk;
      });
      response.addListener("end", function () {
        callback({
          url: req.url
          , statusCode: response.statusCode
          , body: resp
        });
      });

    });
    if (req.data) {
      request.write(req.data);
    }
    request.end(); 
  };

}();

exports.Client = couchdb.Client;
