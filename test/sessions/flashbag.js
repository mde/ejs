var assert = require('assert')
  , sessions = require('../../lib/sessions')
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
    var flashBag = new sessions.FlashBag(sessionMock);
    assert.ok(flashBag instanceof sessions.FlashBag);

    flashBag.add('foo error','error');
    flashBag.add('foo bar error','error');
    flashBag.add('foo info','info');
    flashBag.add('foo success','success');
    flashBag.add('foo custom','custom');

    assert.strictEqual(flashBag.has(), true);

    var errors = flashBag.get('error');
    assert.equal(errors.length, 2);
    assert.equal(errors[0], 'foo error');
    assert.equal(errors[1], 'foo bar error');

    var infos = flashBag.get('info');
    assert.equal(infos.length, 1);
    assert.equal(infos[0], 'foo info');

    var successes = flashBag.get('success');
    assert.equal(successes.length, 1);
    assert.equal(successes[0], 'foo success');

    var customs = flashBag.get('custom');
    assert.equal(customs.length, 1);
    assert.equal(customs[0], 'foo custom');

    assert.strictEqual(flashBag.has(), false);
  }
};

module.exports = tests;
