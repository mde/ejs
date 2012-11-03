var assert = require('assert')
  , Request = require('../lib/request').Request
  , ServerRequest = require('http').IncomingMessage
  , tests;

tests = {
  'create instance': function () {
    var serverReq = new ServerRequest()
      , req = new Request(serverReq);
    assert.ok(req instanceof Request);
  }

};

module.exports = tests;


