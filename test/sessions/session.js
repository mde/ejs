var session = require('../../lib/sessions')
  , assert = require('assert')
  , mockController = {
      accessTime: 0
    , cookies: {
        set: function () {}
      , get: function () {return 'cows'}
      }
    }
  , sess
  , tests = {};

tests = {
  'before': function (next) {
    var config = {
          sessions: {
            store: 'memory'
          , key: 'test_'
          }
        , flashes: {}
        };
    session.createStore(config, next);
  }

, 'beforeEach': function (next) {
    sess = new session.Session(mockController, function () {
      next();
    });
  }

, 'session set and get': function () {
    sess.set('Zooby', 2020);
    assert.equal(sess.get('Zooby'), 2020);
  }

, 'session toJSON': function () {
    sess.set('Zooby', 2030);
    assert.deepEqual(sess.toJSON(), {Zooby: 2030});
  }

, 'session toJSON returns a shallow copy': function () {
    var result;
    sess.set('Zooby', 2040);
    result = sess.toJSON();
    result.Zooby = 2000;
    assert.deepEqual(sess.toJSON(), {Zooby: 2040});
  }

, 'session reset': function () {
    var origId = sess.id;
    sess.set('Zooby', 1001);
    sess.reset();
    assert.ok(origId != sess.id);
    assert.equal(undefined, sess.get('Zooby'));
  }

, 'session close after reset': function (next) {
    sess.reset();
    sess.close(next);
  }

};

module.exports = tests;
