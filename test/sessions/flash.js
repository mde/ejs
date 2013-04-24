var assert = require('assert')
  , Flash = require('../../lib/sessions/flash').Flash
  , tests;

var sessionMock = {
  data: {},
  set: function(name, value) {
    this.data[name] = value;
  },
  get: function(name) {
    return this.data[name] || null;
  }
}

tests = {

  'flash messages isEmpty': function () {
    var flash = new Flash(sessionMock);
    flash.set('foo', 'Zerb');
    assert.ok(!flash.isEmpty());
    sessionMock.data = {};
  }

, 'flash messages hasMessages': function () {
    var flash = new Flash(sessionMock);
    flash.set('foo', 'Zerb');
    assert.ok(flash.hasMessages());
    sessionMock.data = {};
  }

, 'flash messages set/get by key': function () {
    var flash = new Flash(sessionMock)
      , msg;
    flash.set('foo', 'Zerb');
    msg = flash.get('foo');
    assert.equal('Zerb', msg);
    sessionMock.data = {};
  }

, 'flash messages set/get entire object': function () {
    var flash = new Flash(sessionMock)
      , msg;
    flash.set({foo: 'Zerb'});
    msg = flash.get();
    assert.equal('Zerb', msg.foo);
    sessionMock.data = {};
  }

, 'flash get previous messages': function () {
    var flash;
    sessionMock.data = {
      flashMessages: {
        foo: 'Zerb'
      }
    };
    flash = new Flash(sessionMock);
    assert.ok(flash.hasMessages());
    msg = flash.get('foo');
    assert.equal('Zerb', msg);
    sessionMock.data = {};
  }

, 'flash close removes previous messages': function () {
    var flash;
    sessionMock.data = {
      flashMessages: {
        foo: 'Zerb'
      }
    };
    flash = new Flash(sessionMock);
    flash.close();
    assert.ok(!flash.get('foo'));
    assert.ok(!sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash close does not remove new messages': function () {
    var flash = new Flash(sessionMock);
    flash.set('foo', 'Zerb');
    flash.close();
    assert.ok(flash.get('foo'));
    assert.ok(sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash keeep prevents removal of previous messages': function () {
    var flash;
    sessionMock.data = {
      flashMessages: {
        foo: 'Zerb'
      }
    };
    flash = new Flash(sessionMock);
    flash.keep('foo');
    flash.close();
    assert.ok(flash.get('foo'));
    assert.ok(sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash discard marks new messages for removal': function () {
    var flash = new Flash(sessionMock);
    flash.set('foo', 'Zerb');
    flash.discard('foo');
    flash.close();
    assert.ok(!flash.get('foo'));
    assert.ok(!sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

};

module.exports = tests;
