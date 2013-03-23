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
  controller.response = {};
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

, 'action with sync after-filter': function (next) {
    var c = createController()
      , incr = 0;
    c.foo = function () {
      incr++;
    };
    c.after(function () {
      assert.equal(1, incr);
      next();
    });
    c._handleAction('foo');
  }

};

module.exports = tests;



