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

    flash.add('foo error','error');
    flash.add('foo bar error','error');
    flash.add('foo info','info');
    flash.add('foo success','success');
    flash.add('foo custom','custom');

    assert.strictEqual(flash.has(), true);

    var errors = flash.get('error');
    assert.equal(errors.length, 2);
    assert.equal(errors[0], 'foo error');
    assert.equal(errors[1], 'foo bar error');

    var infos = flash.get('info');
    assert.equal(infos.length, 1);
    assert.equal(infos[0], 'foo info');

    var successes = flash.get('success');
    assert.equal(successes.length, 1);
    assert.equal(successes[0], 'foo success');

    var customs = flash.get('custom');
    assert.equal(customs.length, 1);
    assert.equal(customs[0], 'foo custom');

    assert.strictEqual(flash.has(), false);
  }
};

module.exports = tests;
