var assert = require('assert')
  , util = require('utilities')
  , Responder = require('../../lib/controller/responder')
  // For unit testing purposes we'll inject this shim in place of a real controller
  , MockController = require('../mocks/controller.js').Controller
  , tests = {}
  , modelMixin = {
      id: 'mambo-no-5'
    , type: 'zooby'
    , toObj: function () {
        var buf = {};
        for(var key in this) {
          if(this.hasOwnProperty(key)
            && key !== 'toObj'
            && key !== 'type') {
            buf[key] = this[key];
          }
        }
        return buf;
      }
    };

/*
// Just to make sure our lowest level method is working
tests['respond in html'] = function (next) {
  var shim = new MockController()
    , rspr = new Responder(shim);

  shim.responder = rspr;

  rspr.respond(
    '<div />'
  , {format:'html',contentType:'text/html'}
  , function (buffer) {
      assert.deepEqual(buffer, {
        headers: {"Content-Type":"text/html"}
      , content: '"<div />"'
      });
      next();
    }
  );
};

tests['respondTo html'] = function (next) {
  var shim = new MockController()
    , rspr = new Responder(shim)
    , content = {moo:'cow'};

  rspr.respondTo(content, {
    html: function (content, negotiated) {
      this.respond(
        content
      , negotiated
      , function (buffer) {
          assert.deepEqual(buffer, {
            headers: {"Content-Type":"text/html"}
            // We are asserting against JSON because our testing
            // shim stringifies whatever content it is given
          , content: '{"moo":"cow"}'
          });
          next();
        }
      );
    }
  });
};

// Ensures that it throws on an unrecognized format
tests['respondTo unknown format'] = function () {
  var shim = new MockController({format: 'zooby'})
    , rspr = new Responder(shim)
    , content = {cuck:'coo'};

  assert.throws(function () {
    rspr.respondTo(content);
  });
};

// Ensures that it does not throw on a default format, and
// responds appropriately
tests['respondTo default html format'] = function (next) {
  var shim = new MockController({format: 'html'})
    , rspr = new Responder(shim)
    , content = {mao:'cat'};

  assert.doesNotThrow(function () {
    rspr.respondTo(content, {}, {}
      , function () {
          assert.deepEqual(shim.buffer
            , {
                headers: {"Content-Type":"text/html"}
              , content: '{"mao":"cat"}'
            });
          next();
        });
  });
};

// The JSON format should look identical to the html
// format because our testing shim uses JSON.stringify
// for template rendering
tests['respondTo default json format'] = function (next) {
  var shim = new MockController({format: 'json'})
    , rspr = new Responder(shim)
    , content = {bow:'dog'};

  assert.doesNotThrow(function () {
    rspr.respondTo(content, {}, {}
      , function (buffer) {
          assert.deepEqual(shim.buffer
            , {
                headers: {"Content-Type":"application/json"}
              , content: '{"bow":"dog"}'
            });
          next();
        });
  });
};

tests['respondWith html index'] = function (next) {
  var shim = new MockController({
        params: {
          action: 'index'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function (buffer) {
    assert.deepEqual(shim.buffer
      , {
          headers: {"Content-Type":"text/html"}
          // In a HTML response, we expect a params and zooby
          // hash to be sent to the client
        , content: JSON.stringify({
            params:{
              format:"html"
            , action:"index"
            }
            , zooby:{wuff:"pup",id:"mambo-no-5"}
            })
        });
    next();
  });
};

tests['respondWith html create'] = function (next) {
  var shim = new MockController({
        params: {
          action: 'create'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function () {
    // On a successful create we expect a flash message and redirect
    assert.deepEqual(shim.redirectedTo, {id: content.id});
    assert.deepEqual(shim.flashMessage, {type:'success',msg:'zooby created'});
    next();
  });
};

tests['respondWith html create with errors'] = function (next) {
  var shim = new MockController({
        params: {
          action: 'create'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    , errors: {
        wuff: 'bark'
      }
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function () {
    // On a failed create we also set a flash and redirect
    assert.deepEqual(shim.redirectedTo, {action: 'add'});
    assert.deepEqual(shim.flashMessage, {type:'error',msg:{wuff:'bark'}});
    next();
  });
};

tests['respondWith json index'] = function (next) {
  var shim = new MockController({
        format: 'json'
      , params: {
          action: 'index'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function (buffer) {
    assert.deepEqual(shim.buffer
      , {
          headers: {"Content-Type":"application/json"}
          // In contrast to HTML responses, API responses
          // shouldn't have the params cruft as they're
          // not rendering templates
        , content: JSON.stringify({
              wuff:"pup"
            , id:"mambo-no-5"
            })
        });
    next();
  });
};

tests['respondWith json create'] = function (next) {
  var shim = new MockController({
        format: 'json'
      , params: {
          action: 'create'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function () {
    assert.strictEqual(shim.redirectedTo, null);
    assert.strictEqual(shim.flashMessage, null);

    // It's hard to test stringified shit!
    shim.buffer.content = JSON.parse(shim.buffer.content);

    assert.deepEqual(shim.buffer
      , {
          headers: {"Content-Type":"application/json"}
        , content: {wuff:"pup",id:"mambo-no-5"}
        });
    next();
  });
};

tests['respondWith json create with errors'] = function (next) {
  var shim = new MockController({
        format: 'json'
      , params: {
          action: 'create'
        }
      })
    , rspr = new Responder(shim)
    , content = {
      wuff:'pup'
    , errors: {
        wuff: 'bark'
      }
    };

  util.mixin(content, modelMixin);

  rspr.respondWith(content, {}, function () {
    assert.strictEqual(shim.redirectedTo, null);
    assert.strictEqual(shim.flashMessage, null);

    // Hard to test stringified shit
    shim.buffer.content = JSON.parse(shim.buffer.content);

    assert.deepEqual(shim.buffer
      , {
          headers: {"Content-Type":"application/json"}
        , content: {
            wuff:"pup"
          , id:"mambo-no-5"
          , errors:{"wuff":"bark"}
          }
        });
    next();
  });
};
*/

module.exports = tests;
