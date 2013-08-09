var assert = require('assert')
  , utils = require('utilities')
  , Responder = require('../../lib/controller/responder')
  , Controller = require('../../lib/controller/base_controller').BaseController
  , tests
  , createModelInstance = function () {
      return {
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
      }
    }
  , createController = function () {
      var c = new Controller();
      c.request = new MockRequest();
      c.params = {};
      c.canRespondTo(['html', 'json', 'js']);
      c.renderTemplate = function (data, opts, callback) {
        callback('<div>' + JSON.stringify(data) + '</div>');
      };
      c.flash = {
        set:function (type, msg) {
          c.flashMessage = {type:type,msg:msg};
        }
      };
      return c;
    };


global.geddy = {
  config: {
    fullHostname: 'http://foo.com'
  }
};

var MockRequest = function () {
  this.headers = {
    accept: '*/*'
  }
};

// Just to make sure our lowest level method is working
tests = {
  'respond in html, format specified and supported': function (next) {
    var c = createController();
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"foo":"bar"}</div>', content);
      next();
    };
    c.respond({foo: 'bar'}, {format: 'html'});
  }

, 'respond in html, format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'html';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"foo":"bar"}</div>', content);
      next();
    };
    c.respond({foo: 'bar'});
  }

, 'respond in json, format specified and supported': function (next) {
    var c = createController();
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"foo":"bar"}', content);
      next();
    };
    c.respond({foo: 'bar'}, {format: 'json'});
  }

, 'respond in json, format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'json';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"foo":"bar"}', content);
      next();
    };
    c.respond({foo: 'bar'});
  }

, 'respond in js (JSONP), format specified and supported': function (next) {
    var c = createController();
    c.params.callback = 'zoobyasdf';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/javascript', headers['Content-Type']);
      assert.equal('zoobyasdf({"foo":"bar"});', content);
      next();
    };
    c.respond({foo: 'bar'}, {format: 'js'});
  }

, 'respond in js (JSONP), format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'js';
    c.params.callback = 'zoobyasdf';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/javascript', headers['Content-Type']);
      assert.equal('zoobyasdf({"foo":"bar"});', content);
      next();
    };
    c.respond({foo: 'bar'});
  }

, 'respond with available built-in format even if controller \
doesn\'t explicitly explicitly support it': function (next) {
    var c = createController();
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/xml', headers['Content-Type']);
      assert.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<object>\n   <foo>bar</foo>\n</object>\n', content);
      next();
    };
    c.respond({foo: 'bar'}, {format: 'xml'});
  }

, 'respond with first supported format if no format specified': function (next) {
    var c = createController();
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"foo":"bar"}</div>', content);
      next();
    };
    c.respond({foo: 'bar'});
  }

, 'throw when unsupported format requested': function (next) {
    var c = createController();
    assert.throws(function () {
      c.respond({foo: 'bar'}, {format: 'frang'});
    });
    next();
  }

, 'respond, override statusCode': function (next) {
    var c = createController();
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(222, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"foo":"bar"}</div>', content);
      next();
    };
    c.respond({foo: 'bar'}, {statusCode: 222});
  }

// respondTo tests, mid-level API
, 'respondTo html, format specified and supported': function (next) {
    var c = createController();
    c.respondTo({
      html: function () {
        next();
      }
    }, {format: 'html'});
  }

, 'respondTo html, format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.respondTo({
      html: function () {
        next();
      }
    });
  }

, 'respondTo xml, format in specified and in strategy, \
but not explicitly supported on controller': function (next) {
    var c = createController();
    c.respondTo({
      xml: function () {
        next();
      }
    }, {format: 'xml'});
  }

, 'respondTo xml, format in params and in strategy, \
but not explicitly supported on controller': function (next) {
    var c = createController();
    c.respondTo({
      xml: function () {
        next();
      }
    }, {format: 'xml'});
  }

// respondWith tests, top-level API
, 'respondWith html create action, format in params': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.params.action = 'create';
    c.redirect = function (target) {
      assert.equal('mambo-no-5', target.id);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith json create action, format in params': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.params.action = 'create';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(201, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('http://foo.com/zoobies/mambo-no-5', headers['Location']);
      assert.equal('{"id":"mambo-no-5","type":"zooby"}', content);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html create action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'create';
    c.redirect = function (target) {
      assert.equal('error', c.flashMessage.type);
      assert.equal('asdf', c.flashMessage.msg.poop);
      assert.equal('add', target.action);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      poop: 'asdf'
    };
    c.respondWith(inst);
  }

, 'respondWith json create action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'json';
    c.params.action = 'create';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","errors":{"poop":"asdf"},"type":"zooby"}',
          content);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      poop: 'asdf'
    };
    c.respondWith(inst);
  }

, 'respondWith html remove action, format in params': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.params.action = 'remove';
    c.redirect = function (target) {
      assert.equal(undefined, target.id);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith json remove action, format in params': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.params.action = 'remove';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","type":"zooby"}',
          content);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html remove action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'remove';
    c.redirect = function (target) {
      assert.equal('error', c.flashMessage.type);
      assert.equal('zerp', c.flashMessage.msg.derp);
      assert.equal('edit', target.action);
      assert.equal('mambo-no-5', target.id);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      derp: 'zerp'
    };
    c.respondWith(inst);
  }

, 'respondWith json remove action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'json';
    c.params.action = 'remove';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","errors":{"derp":"zerp"},"type":"zooby"}',
          content);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      derp: 'zerp'
    };
    c.respondWith(inst);
  }

, 'respondWith html update action, format in params': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.params.action = 'update';
    c.redirect = function (target) {
      assert.equal('mambo-no-5', target.id);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith json update action, format in params': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.params.action = 'update';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","type":"zooby"}',
          content);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html update action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'update';
    c.redirect = function (target) {
      assert.equal('error', c.flashMessage.type);
      assert.equal('zerp', c.flashMessage.msg.derp);
      assert.equal('edit', target.action);
      assert.equal('mambo-no-5', target.id);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      derp: 'zerp'
    };
    c.respondWith(inst);
  }

, 'respondWith json update action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'json';
    c.params.action = 'update';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","errors":{"derp":"zerp"},"type":"zooby"}',
          content);
      next();
    };
    inst = createModelInstance();
    inst.errors = {
      derp: 'zerp'
    };
    c.respondWith(inst);
  }

, 'respondWith html show action, format in params': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.params.action = 'show';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"params":{"format":"html","action":"show"},' +
          '"zooby":{"id":"mambo-no-5"}}</div>', content);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith json show action, format in params': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.params.action = 'show';
    c._doResponse = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"id":"mambo-no-5","type":"zooby"}', content);
      next();
    };
    c.respondWith(createModelInstance());
  }

};

module.exports = tests;
