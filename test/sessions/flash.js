var assert = require('assert')
  , Flash = require('../../lib/sessions/flash').Flash
  , config = {
    defaultClass: 'a'
  , inlineClasses: {
      foo: 'b',
      bar: 'c',
    }
  , blockClasses: {
      foo: 'f',
      bar: 'g',
    }
  }
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
    var flash = new Flash(sessionMock,config);
    flash.set('foo', 'Zerb');
    assert.ok(!flash.isEmpty());
    sessionMock.data = {};
  }

, 'flash messages hasMessages': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', 'Zerb');
    assert.ok(flash.hasMessages());
    sessionMock.data = {};
  }

, 'flash messages set/get by key': function () {
    var flash = new Flash(sessionMock,config)
      , msg;
    flash.set('foo', 'Zerb');
    msg = flash.get('foo');
    assert.equal('Zerb', msg);
    sessionMock.data = {};
  }

, 'flash messages set/get unknown type by key': function () {
    var flash = new Flash(sessionMock,config)
      , msg;
    flash.set('moo', 'Zerb');
    msg = flash.get('moo');
    assert.equal('Zerb', msg);
    sessionMock.data = {};
  }

, 'flash messages set/get object by key': function () {
    var flash = new Flash(sessionMock,config)
      , msg;
    flash.set('foo', {Zerb:'Zoob'});
    msg = flash.get('foo');
    assert.deepEqual({Zerb:'Zoob'}, msg);
    sessionMock.data = {};
  }

, 'flash messages set/get entire object': function () {
    var flash = new Flash(sessionMock,config)
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
    flash = new Flash(sessionMock,config);
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
    flash = new Flash(sessionMock,config);
    flash.close();
    assert.ok(!flash.get('foo'));
    assert.ok(!sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash close does not remove new messages': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', 'Zerb');
    flash.close();
    assert.ok(flash.get('foo'));
    assert.ok(sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash keep prevents removal of previous messages': function () {
    var flash;
    sessionMock.data = {
      flashMessages: {
        foo: 'Zerb'
      }
    };
    flash = new Flash(sessionMock,config);
    flash.keep('foo');
    flash.close();
    assert.ok(flash.get('foo'));
    assert.ok(sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash discard marks new messages for removal': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', 'Zerb');
    flash.discard('foo');
    flash.close();
    assert.ok(!flash.get('foo'));
    assert.ok(!sessionMock.get('flashMessages').foo);
    sessionMock.data = {};
  }

, 'flash describe inline': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', 'Zerb');
    assert.ok(flash.get('foo'));
    sessionMock.data = {};
  }

, 'flash describe single block': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', {Zerb:'Zooby'});
    assert.ok(flash.get('foo'));
    sessionMock.data = {};
  }

, 'flash describe multiple lowercase block': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', {Zerb:'Zooby',Merb:'Mooby'});
    assert.ok(flash.get('foo'));
    sessionMock.data = {};
  }

, 'flash describe multiple uppercase block uppercase': function () {
    var flash = new Flash(sessionMock,config);
    flash.set('foo', {zerb:'Zooby',merb:'Mooby'});
    assert.ok(flash.get('foo'));
    sessionMock.data = {};
  }

};

module.exports = tests;
