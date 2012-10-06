var EventBuffer = require('utilities').EventBuffer
  , EventEmitter = require('events').EventEmitter;

var Request = function (httpReq) {
  var self = this
      , reqProperties = [
          'method'
        , 'url'
        , 'headers'
        , 'trailers'
        , 'httpVersion'
        , 'connection'
        ];
  this.buffer = new EventBuffer(httpReq);
  reqProperties.forEach(function (prop) {
    self[prop] = httpReq[prop];
  });
};

Request.prototype = new EventEmitter();
Request.prototype.constructor = Request;

Request.prototype.sync = function () {
  this.buffer.sync(this);
};

module.exports.Request = Request;
