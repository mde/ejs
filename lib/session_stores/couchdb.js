var sys = require("sys");
var http = require("http");

var Couchdb = function () {
  var _this = this;
  var _sessions = {};
  var _readCallback;
  var _writeCallback;
  
  this.read = function (sid, callback) {
    _readCallback = callback;
    this.request({url: '/' + config.dbName +
        '/' + sid, method: 'GET'}, this.ensureRead);
  };

  this.ensureRead = function (response) {
    if (response.statusCode == 404) {
      _this.create(response);
    }
    else {
      var url = response.url;
      var sid = url.substr(url.lastIndexOf('/') + 1);
      var data = JSON.parse(response.body);
      _sessions[sid] = data;
      _readCallback(_sessions[sid]);
    }
  };

  this.create = function (response) {
    var url = response.url;
    var sid = url.substr(url.lastIndexOf('/') + 1);
    this.request({url: '/' + config.dbName +
        '/' + sid, method: 'PUT', data: {}}, this.ensureRead);
  };

  this.ensureCreate = function (response) {
    if (response.statusCode == 201) {
      var url = response.url;
      var sid = url.substr(url.lastIndexOf('/') + 1);
      var data = JSON.parse(response.body);
      _sessions[sid] = data;
      _readCallback(_sessions[sid]);
    }
    else {
      throw new Error('could not create CouchDB session.');
    }
  };
  
  this.write = function (sid, store, callback) {
    this.request({url: '/' + config.dbName +
        '/' + sid, method: 'PUT', data: store}, this.ensureUpdate);
    _writeCallback = callback;
  };

  this.ensureUpdate = function (response) {
    _writeCallback();
  };

  this.request = function (params, callback) {
    var req = {};
    req.url = params.url;
    req.method = params.method || 'GET';
    req.data = JSON.stringify(params.data) || null;
    
    var headers = {host: config.dbHostname};
    if (req.data) {
      headers['content-length'] = req.data.length;
    }
    
    var client = http.createClient(config.dbPort, config.dbHostname);
    var request = client.request(req.method, req.url, headers);
    request.addListener('response', function (response) {
      //sys.puts("STATUS: " + response.statusCode);
      //sys.puts("HEADERS: " + JSON.stringify(response.headers));
      response.setBodyEncoding("utf8");
      response.addListener("data", function (chunk) {
        //sys.puts("BODY: " + chunk);
        callback({
          url: req.url,
          statusCode: response.statusCode,
          body: chunk
        });
      });
    });
    if (req.data) {
      request.write(req.data);
    }
    request.close(); 
  };
  
  // TODO: Create the correctly named DB on app startup if it's not there
  //this.request({url: '/' + config.dbName, method: 'PUT'}, this.ensureRead);
  
};


exports.Couchdb = Couchdb;

