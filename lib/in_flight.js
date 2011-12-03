var errors = require('./errors');

var InFlight = function () {
  this.entries = {};
};

InFlight.prototype = new (function () {

  this.addEntry = function (req, method, resp, accessTime) {
    var id = geddy.string.uuid();
    req._geddyId = id;
    resp._geddyId = id;
    this.entries[id] = {
      request: req
    , method: method
    , response: resp
    , accessTime: accessTime
    };
    this.wrapResponseEnd(resp);
  };

  this.removeEntry = function (id) {
    delete this.entries[id];
  };

  this.getEntry = function (id) {
    return this.entries[id];
  };

  this.wrapResponseEnd = function (resp) {
    var self = this;
    resp.addListener('finish', function () {
      self.finalize(resp);
    });
  };

  this.finalize = function (resp) {
    var id = resp._geddyId
      , entry = this.entries[id]
      , req = entry.request
      , stat = resp.statusCode
      , level = parseInt(stat, 10) > 499 ? 'error' : 'access';
    // Apache extended log-format
    geddy.log[level](req.connection.remoteAddress + ' ' +
        '- ' +
        '- ' +
        '[' + new Date(entry.accessTime) + '] ' +
        '"' + entry.method + ' ' + req.url + ' ' + req.httpVersion + '" ' +
        stat + ' ' +
        (resp._length || '-') + ' ' +
        '"' + (req.headers['referer'] || '-') + '" ' +
        '"' + (req.headers['user-agent'] || '-') + '" ');
    this.removeEntry[id];
  };

  this.addListeners = function (req, resp) {
    var self = this;
    req.addListener('end', function () {
      id = req._geddyId
        , entry = self.entries[id];
      geddy.log.access(req.connection.remoteAddress +
          " " + new Date(entry.accessTime) + " " + entry.method + " " + req.url);
    });

  };
})();

module.exports.InFlight = InFlight;
