var assert = require('assert')
  , Flash = require('../../lib/sessions/flash').Flash
  , tests;

var sessionMock = {
  _values: {},
  set: function(name, value) {
    this._values[name] = value;
  },
  get: function(name) {
    return this._values[name] || null;
  }
}

tests = {
  'flash messages': function () {
    var flash = new Flash(sessionMock);
    assert.ok(flash instanceof Flash);

    flash.addMessage('foo error','error');
    flash.addMessage('foo bar error','error');
    flash.addMessage('foo info','info');
    flash.addMessage('foo success','success');
    flash.addMessage('foo custom','custom');

    assert.strictEqual(flash.hasMessages(), true);

    var errors = flash.getMessages('error');
    assert.equal(errors.length, 2);
    assert.equal(errors[0], 'foo error');
    assert.equal(errors[1], 'foo bar error');

    var infos = flash.getMessages('info');
    assert.equal(infos.length, 1);
    assert.equal(infos[0], 'foo info');

    var successes = flash.getMessages('success');
    assert.equal(successes.length, 1);
    assert.equal(successes[0], 'foo success');

    var customs = flash.getMessages('custom');
    assert.equal(customs.length, 1);
    assert.equal(customs[0], 'foo custom');

    assert.strictEqual(flash.hasMessages(), false);
  }
};

module.exports = tests;
