var EventBuffer = require('utilities').EventBuffer
  , EventEmitter = require('events').EventEmitter
  , ServerRequest = require('http').IncomingMessage
  , utils = require('utilities')
  , parseQuery
  , Request;

parseQuery = function (url) {
  var str = String(url);
  var q = str.split('?')[1] || '';
  return q ? utils.uri.objectify(q) : {};
};

Request = function (req) {
  // Copy has-own props over from original
  utils.mixin(this, req);
  // Save original req obj
  this.req = req;
  // Set up buffering
  this.buffer = new EventBuffer(req);

  // Implement some of the methods expected by Connect middleware
  this.query = parseQuery(req.url);
};

// Inherit from actual ServerRequest
Request.prototype = new ServerRequest();
Request.prototype.constructor = Request;

Request.prototype.sync = function () {
  this.buffer.sync(this);
};

module.exports.Request = Request;
