var errors = require('./errors');

var InFlight = function () {
  this.entries = new geddy.SortedCollection();
};

InFlight.prototype = new (function () {

  this.addEntry = function (req, method, resp, accessTime) {
    var id = geddy.string.uuid();
    req._geddyId = id;
    resp._geddyId = id;
    this.entries.addItem(id, {
      request: req
    , method: method
    , response: resp
    , accessTime: accessTime
    });
    this.addListeners(req, resp);
  };

  this.updateEntry = function (id, obj) {
    geddy.mixin(this.entries.getItem(id), obj);
  };

  this.removeEntry = function (id) {
    this.entries.removeItem(id);
  };

  this.getEntry = function (id) {
    return this.entries.getItem(id);
  };

  this.getCount = function () {
    return this.entries.count;
  };

  this.each = function (handler) {
    this.entries.each(handler);
  };

  this.finalize = function (resp) {
    var id = resp._geddyId
      , entry = this.entries.getItem(id)
      , req = entry.request
      , stat = resp.statusCode
      , level = parseInt(stat, 10) > 499 ? 'error' : 'access';
    // Apache extended log-format
    geddy.log[level](req.connection.remoteAddress + ' ' +
        '- ' +
        '- ' +
        '[' + new Date(entry.accessTime) + '] ' +
        '"' + entry.method + ' ' + req.url + ' ' +
            req.httpVersion + '" ' +
        stat + ' ' +
        (resp._length || '-') + ' ' +
        '"' + (req.headers['referer'] || '-') + '" ' +
        '"' + (req.headers['user-agent'] || '-') + '" ');
    this.removeEntry(id);
  };

  this.addListeners = function (req, resp) {
    var self = this;
    resp.addListener('finish', function () {
      self.finalize(resp);
    });
  };
})();

module.exports.InFlight = InFlight;
