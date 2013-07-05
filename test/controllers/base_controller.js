var assert = require('assert')
  , BaseController = require('../../lib/controller/base_controller').BaseController
  , tests
  , createController;

global.geddy = {
  config: {}
, log: {
    error: function () {}
  }
};

createController = function () {
  var controller = new BaseController();
  controller.app = {};
  controller.request = {};
  controller.response = {
    setHeaders: function () {}
  , finalize: function () {}
  };
  controller.method = 'GET';
  controller.params = {};
  controller.name = 'Base';
  return controller;
};

tests = {
  'create instance': function () {
    var inst = new BaseController();
    assert.ok(inst instanceof BaseController);
  }

, 'simple handle action': function (next) {
    var c = createController();
    c.foo = function () {
      next();
    };
    c._handleAction('foo');
  }

, 'action with sync before-filter': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(1, incr);
      next();
    };
    c.before(function () {
      incr++;
    });
    c._handleAction('foo');
  }

, 'action with async before-filter': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(1, incr);
      next();
    };
    c.before(function (n) {
      incr++;
      n();
    }, {async: true});
    c._handleAction('foo');
  }

, 'action with multiple async before-filters': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(2, incr);
      next();
    };
    c.before(function (n) {
      incr++;
      n();
    }, {async: true});
    c.before(function (n) {
      incr++;
      n();
    }, {async: true});
    c._handleAction('foo');
  }

, 'action with sync before-filter and "except"': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(0, incr);
      next();
    };
    c.before(function () {
      incr++;
    }, {except: 'foo'});
    c._handleAction('foo');
  }

, 'action with sync before-filter and "only"': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(1, incr);
      next();
    };
    c.before(function () {
      incr++;
    }, {only: 'foo'});
    c._handleAction('foo');
  }

, 'action with multiple async before-filters and "except" on the first': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(1, incr);
      next();
    };
    c.before(function (n) {
      incr++;
      n();
    }, {async: true, except: ['foo']});
    c.before(function (n) {
      incr++;
      n();
    }, {async: true});
    c._handleAction('foo');
  }

, 'action with multiple async before-filters and "only" on the first': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      assert.equal(1, incr);
      next();
    };
    c.before(function (n) {
      incr++;
      n();
    }, {async: true, only: ['bar']});
    c.before(function (n) {
      incr++;
      n();
    }, {async: true});
    c._handleAction('foo');
  }


, 'action with sync after-filter': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      incr++;
      c._doResponse(200,
          {'Content-Type': 'text/plain'}, 'howdy');
    };
    c.after(function () {
      assert.equal(1, incr);
      next();
    });
    c.params = {
      action: 'foo'
    };
    c._handleAction('foo');
  }

, 'action with sync after-filter and "only" with same action': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      incr++;
      c._doResponse(200,
          {'Content-Type': 'text/plain'}, 'howdy');
    };
    c.after(function () {
      assert.equal(1, incr);
      next();
    }, {only: ['foo']});
    c.params = {
      action: 'foo'
    };
    c._handleAction('foo');
  }

, 'action with sync after-filters and "only" with different action': function (next) {
    var c = createController()
      , incr = 0;
    c.bar = function () {
      incr++;
      c._doResponse(200,
          {'Content-Type': 'text/plain'}, 'howdy');
    };
    c.after(function () {
      incr++;
    }, {only: ['foo']});
    c.after(function () {
      assert.equal(1, incr);
      next();
    });
    c.params = {
      action: 'bar'
    };
    c._handleAction('bar');
  }

, 'action with sync after-filters and "except" with same action': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      incr++;
      c._doResponse(200,
          {'Content-Type': 'text/plain'}, 'howdy');
    };
    c.after(function () {
      incr++;
    }, {except: ['foo']});
    c.after(function () {
      assert.equal(1, incr);
      next();
    });
    c.params = {
      action: 'foo'
    };
    c._handleAction('foo');
  }

, 'action with sync after-filters and "except" with different action': function (next) {
    var c = createController()
      , incr = 0;
    c.bar = function () {
      incr++;
      c._doResponse(200,
          {'Content-Type': 'text/plain'}, 'howdy');
    };
    c.after(function () {
      incr++;
    }, {except: 'foo'});
    c.after(function () {
      assert.equal(2, incr);
      next();
    });
    c.params = {
      action: 'bar'
    };
    c._handleAction('bar');
  }

};

module.exports = tests;



