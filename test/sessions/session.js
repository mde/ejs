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

tests['before'] = function (next) {
  session.createStore('memory', function () {
    var tempGeddy = geddy;

    geddy = {
      config: {
        sessions: {
          key: 'test_'
        }
      , flashes: {
        }
      }
    };

    sess = new session.Session(mockController, function () {
      geddy = tempGeddy;
      next();
    });
  });
};

tests['session set and get'] = function () {
  sess.set('Zooby', 2020);
  assert.equal(sess.get('Zooby'), 2020);
};

tests['session toJSON'] = function () {
  sess.set('Zooby', 2030);
  assert.deepEqual(sess.toJSON(), {Zooby: 2030});
};

tests['session toJSON returns a shallow copy'] = function () {
  var result;

  sess.set('Zooby', 2040);

  result = sess.toJSON();
  result.Zooby = 2000;

  assert.deepEqual(sess.toJSON(), {Zooby: 2040});
};

module.exports = tests;
