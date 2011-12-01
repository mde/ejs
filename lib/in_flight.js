
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
    this.addListeners(req, resp);
  };

  this.removeEntry = function (id) {
    delete this.entries[id];
  };

  this.addListeners = function (req, resp) {
    var self = this;
    req.addListener('end', function () {
      id = req._geddyId
        , entry = self.entries[id];
      geddy.log.access(req.connection.remoteAddress +
          " " + new Date(entry.accessTime) + " " + entry.method + " " + req.url);
    });

    resp.addListener('end', function () {
    });


  };
})();

module.exports.InFlight = InFlight;
