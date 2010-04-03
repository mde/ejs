var sys = require("sys");
var http = require("http");

var Couchdb = function (callback) {
  this.setup(callback);
};

Couchdb.prototype = new function () {
  var _this = this;
  var _sessions = {};
  var _appCallback;
 
  this.setup = function (callback) {
    _appCallback = callback;
    this.request({url: '/' + config.sessions.dbName, method: 'GET'}, this.ensureSetup);
  };

  this.ensureSetup = function (response) {
    if (response.statusCode == 404) {
      _this.request({url: '/' + config.sessions.dbName, method: 'PUT'}, _this.ensureSetup);
    }
    else {
      _appCallback();
    }
  };

  this.read = function (sid, callback) {
    _appCallback = callback;
    this.request({url: '/' + config.sessions.dbName +
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
      _appCallback(_sessions[sid]);
    }
  };

  this.create = function (response) {
    var url = response.url;
    var sid = url.substr(url.lastIndexOf('/') + 1);
    this.request({url: '/' + config.sessions.dbName +
        '/' + sid, method: 'PUT', data: {}}, this.ensureCreate);
  };

  this.ensureCreate = function (response) {
    if (response.statusCode == 201) {
      var url = response.url;
      var sid = url.substr(url.lastIndexOf('/') + 1);
      var data = JSON.parse(response.body);

      // Avoid another round-trip just to get _id and _rev
      delete data.ok;
      data._id = data.id;
      delete data.id;
      data._rev = data.rev;
      delete data.rev;

      _sessions[sid] = data;
      _appCallback(_sessions[sid]);
    }
    else {
      throw new Error('could not create CouchDB session.');
    }
  };
  
  this.write = function (sid, store, callback) {
    this.request({url: '/' + config.sessions.dbName +
        '/' + sid, method: 'PUT', data: store}, this.ensureUpdate);
    _appCallback = callback;
  };

  this.ensureUpdate = function (response) {
    _appCallback();
  };

  this.request = function (params, callback) {
    var req = {};
    req.url = params.url;
    req.method = params.method || 'GET';
    req.data = JSON.stringify(params.data) || null;
    
    var headers = {host: config.sessions.dbHostname};
    if (req.data) {
      headers['content-length'] = req.data.length;
    }
    
    var client = http.createClient(config.sessions.dbPort, config.sessions.dbHostname);
    var request = client.request(req.method, req.url, headers);
    //sys.puts(req.url);
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
      //sys.puts('PUT data:');
      //sys.puts(req.data);
      request.write(req.data);
    }
    request.close(); 
  };
  
  
}();


exports.Couchdb = Couchdb;

