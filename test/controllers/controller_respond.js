var assert = require('assert')
  , utils = require('utilities')
  , model = require('model')
  , Zooby = require('../fixtures/zooby').Zooby
  , Responder = require('../../lib/controller/responder').Responder
  , Controller = require('../../lib/controller/base_controller').BaseController
  , MockRequest
  , tests
  , createModelInstance = function () {
      var zooby = Zooby.create({
        title: 'asdf'
      , description: 'qwer'
      });
      zooby.id = 'mambo-no-5';
      return zooby;
    }
  , createController = function () {
      var c = new Controller();
      c.request = new MockRequest();
      c.params = {};
      c.name = 'BaseController';
      c.canRespondTo(['html', 'json', 'js']);
      c.renderTemplate = function (data, callback) {
        callback('<div>' + JSON.stringify(data) + '</div>');
      };
      c.flash = {
        set:function (type, msg) {
          c.flashMessage = {type:type,msg:msg};
        }
      };
      return c;
    };

MockRequest = function () {
  this.headers = {
    accept: '*/*'
  }
};

Zooby = model.register('Zooby', Zooby);

// Just to make sure our lowest level method is working
tests = {
  'respond in html, format specified and supported': function (next) {
    var c = createController();
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"zooby":"bar"}</div>', content);
      next();
    };
    c.respond({zooby: 'bar'}, {format: 'html'});
  }

, 'respond in html, format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'html';
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"zooby":"bar"}</div>', content);
      next();
    };
    c.respond({zooby: 'bar'});
  }

, 'respond in json, format specified and supported': function (next) {
    var c = createController();
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"zooby":"bar"}', content);
      next();
    };
    c.respond({zooby: 'bar'}, {format: 'json'});
  }

, 'respond in json, format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('{"zooby":"bar"}', content);
      next();
    };
    c.respond({zooby: 'bar'});
  }

, 'respond in js (JSONP), format specified and supported': function (next) {
    var c = createController();
    c.params.callback = 'zoobyasdf';
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/javascript', headers['Content-Type']);
      assert.equal('zoobyasdf({"zooby":"bar"});', content);
      next();
    };
    c.respond({zooby: 'bar'}, {format: 'js'});
  }

, 'respond in js (JSONP), format in params and supported': function (next) {
    var c = createController();
    c.params.format = 'js';
    c.params.callback = 'zoobyasdf';
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/javascript', headers['Content-Type']);
      assert.equal('zoobyasdf({"zooby":"bar"});', content);
      next();
    };
    c.respond({zooby: 'bar'});
  }

, 'respond with available built-in format even if controller \
doesn\'t explicitly explicitly support it': function (next) {
    var c = createController();
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('application/xml', headers['Content-Type']);
      assert.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<object>\n   <zooby>bar</zooby>\n</object>\n', content);
      next();
    };
    c.respond({zooby: 'bar'}, {format: 'xml'});
  }

, 'respond with first supported format if no format specified': function (next) {
    var c = createController();
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"zooby":"bar"}</div>', content);
      next();
    };
    c.respond({zooby: 'bar'});
  }

, 'throw when unsupported format requested': function (next) {
    var c = createController();
    assert.throws(function () {
      c.respond({zooby: 'bar'}, {format: 'frang'});
    });
    next();
  }

, 'respond, override statusCode': function (next) {
    var c = createController();
    c.output = function (statusCode, headers, content) {
      assert.equal(222, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.equal('<div>{"zooby":"bar"}</div>', content);
      next();
    };
    c.respond({zooby: 'bar'}, {statusCode: 222});
  }

, 'respond, ad-hoc model properties not preserved': function (next) {
    var c = createController()
      , inst = createModelInstance();
    inst.zerp = 'derp';
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.ok(!item.zerp);
      next();
    };
    c.respond(inst, {format: 'json'});
  }

, 'respond, ad-hoc model properties preserved': function (next) {
    var c = createController()
      , inst = createModelInstance()
      , origToJSON = inst.toJSON;
    inst.zerp = 'derp';
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.ok(item.zerp);
      next();
    };
    inst = inst.toJSON({whitelist: ['zerp']});
    c.respond(inst, {format: 'json'});
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(201, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('/zoobies/mambo-no-5', headers['Location']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('Zooby', item.type);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html create action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'create';
    c.transfer = function (action) {
      assert.equal('add', action);
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('asdf', item.errors.poop);
      assert.equal('Zooby', item.type);
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('Zooby', item.type);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html remove action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'remove';
    c.transfer = function (action) {
      assert.equal('edit', action);
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('zerp', item.errors.derp);
      assert.equal('Zooby', item.type);
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('Zooby', item.type);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html update action with error, format in params': function (next) {
    var c = createController()
      , inst;
    c.params.format = 'html';
    c.params.action = 'update';
    c.transfer = function (action) {
      assert.equal('edit', action);
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
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(400, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('zerp', item.errors.derp);
      assert.equal('Zooby', item.type);
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
    c.output = function (statusCode, headers, content) {
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      assert.ok(content.indexOf('<div>') > -1);
      assert.ok(content.indexOf('</div>') > -1);
      assert.ok(content.indexOf('mambo-no-5') > -1);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith json show action, format in params': function (next) {
    var c = createController();
    c.params.format = 'json';
    c.params.action = 'show';
    c.output = function (statusCode, headers, content) {
      var item = JSON.parse(content);
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal('mambo-no-5', item.id);
      assert.equal('Zooby', item.type);
      next();
    };
    c.respondWith(createModelInstance());
  }

, 'respondWith html index action (array data), format in params': function (next) {
    var c = createController()
      , items = [];
    c.params.format = 'html';
    c.params.action = 'index';
    c.output = function (statusCode, headers, content) {
      var parseable
        , data
        , items;
      assert.equal(200, statusCode);
      assert.equal('text/html', headers['Content-Type']);
      // Should be whatever renderTemplate spits out
      assert.ok(content.indexOf('<div>') > -1);
      assert.ok(content.indexOf('</div>') > -1);
      // Strip the token HTML tags, see what content got
      // passed to renderTemplate
      parseable = content.replace('<div>', '').replace('</div>', '');
      data = JSON.parse(parseable);
      // Should have a params obj
      assert.ok(data.params);
      // Should have data items
      items = data.zoobies;
      assert.equal(3, items.length);
      items.forEach(function (item) {
        assert.ok(item.id);
        assert.ok(item.createdAt);
        assert.ok(item.title);
        assert.ok(item.description);
      });
      next();
    };
    items.push(createModelInstance());
    items.push(createModelInstance());
    items.push(createModelInstance());
    c.respondWith(items);
  }

, 'respondWith json index action (array data), format in params': function (next) {
    var c = createController()
      , items = [];
    c.params.format = 'json';
    c.params.action = 'index';
    c.output = function (statusCode, headers, content) {
      var items = JSON.parse(content);
      assert.equal(200, statusCode);
      assert.equal('application/json', headers['Content-Type']);
      assert.equal(3, items.length);
      items.forEach(function (item) {
        assert.ok(item.id);
        assert.ok(item.createdAt);
        assert.ok(item.title);
        assert.ok(item.description);
      });
      next();
    };
    items.push(createModelInstance());
    items.push(createModelInstance());
    items.push(createModelInstance());
    c.respondWith(items);
  }

};

module.exports = tests;
