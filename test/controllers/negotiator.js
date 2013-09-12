var assert = require('assert')
  , util = require('utilities')
  , Negotiator = require('../../lib/controller/responder/negotiator').Negotiator
  // For unit testing purposes we'll inject this shim in place of a real controller
  , tests;

tests = {
  'negotiate defaults to the first format if there is no requested format': function () {
    var n = new Negotiator();
    n.init('*/*', ['html', 'text'], null);
    assert.equal('html', n.negotiate().format);
  }

, 'negotiate will use the requested format set on negotiator': function () {
    var n = new Negotiator();
    n.init('*/*', ['html', 'txt'], 'txt');
    assert.equal('txt', n.negotiate().format);
  }

, 'negotiate will return null when controller does not support default format': function () {
    var n = new Negotiator();
    n.init('*/*', ['html', 'json'], 'txt');
      assert.ok(!n.negotiate());
  }

, 'passed-in format overrides controller\'s acceppted formats': function () {
    var n = new Negotiator();
    n.init('*/*', ['html', 'json'], 'txt');
    assert.equal('xml', n.negotiate('xml').format);
  }

, 'if no requested param, negotiator will pick first client accept format that controller supports': function () {
    var n = new Negotiator();
    n.init('application/xml,application/xhtml+xml,' +
          'text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
          ['xml', 'html', 'json'], null);
    assert.equal('xml', n.negotiate().format);
  }

, 'negotiator will pick first client accept format that matches requested param': function () {
    var n = new Negotiator();
    n.init('application/xml,application/xhtml+xml,' +
          'text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
          ['xml', 'html', 'json'], 'html');
    assert.equal('html', n.negotiate().format);
  }

, 'negotiator will return null if no client accept format matches requested param': function () {
    var n = new Negotiator();
    n.init('application/xml,application/xhtml+xml,' +
          'text/plain;q=0.8,image/png',
          ['xml', 'html', 'json'], 'html');
    assert.ok(!n.negotiate());
  }

, 'passed-in format overrides controller\'s acceppted formats, but has to match client accepts header': function () {
    var n = new Negotiator();
    n.init('application/xml,application/xhtml+xml,' +
          'text/plain;q=0.8,image/png',
          ['xml', 'html', 'json'], 'html', {});
    assert.ok(!n.negotiate('html'));
  }

}

module.exports = tests;
