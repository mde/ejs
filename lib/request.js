var EventBuffer = require('utilities').EventBuffer
  , EventEmitter = require('events').EventEmitter
  , ServerRequest = require('http').IncomingMessage
  , utils = require('utilities');

var Request = function (req) {
  // Copy props over from original
  utils.mixin(this, req);
  // Set up buffering
  this.buffer = new EventBuffer(req);
};

// Inherit from actual ServerRequest
Request.prototype = new ServerRequest();
Request.prototype.constructor = Request;

Request.prototype.sync = function () {
  this.buffer.sync(this);
};

module.exports.Request = Request;
