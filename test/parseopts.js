var assert = require('assert')
  , parseopts = require('../lib/parseopts')
  , Parser = parseopts.Parser
  , tests
  , _opts;

 _opts = [
  { full: 'howdy'
  , abbr: 'h'
  , args: true
  , canon: 'howdy'
  }
, { full: ['derp', 'zoom']
  , abbr: 'd'
  , args: false
  , canon: 'derp'
  }
, { full: ['zong', 'asdf']
  , abbr: ['n', 'b']
  , args: false
  , canon: 'zong'
  }
];


tests = {
  'constructor': function () {
    var p = new Parser(_opts);
    assert.equal(p.longOpts.howdy.canon, 'howdy');
    assert.equal(p.shortOpts.h.canon, 'howdy');
  }

, 'parse short': function () {
    var p = new Parser(_opts);
    p.parse(['-h', 'foo']);
    assert.equal(p.opts.howdy, 'foo');
  }

, 'parse long': function () {
    var p = new Parser(_opts);
    p.parse(['--howdy=bar']);
    assert.equal(p.opts.howdy, 'bar');
  }

, 'parse short with cmds': function () {
    var p = new Parser(_opts);
    p.parse(['asdf', '-h', 'foo', 'qwer']);
    assert.equal(p.opts.howdy, 'foo');
    assert.equal(p.cmds[0], 'asdf');
    assert.equal(p.cmds[1], 'qwer');
  }

, 'parse short with cmds': function () {
    var p = new Parser(_opts);
    p.parse(['asdf', '--howdy=bar', 'qwer']);
    assert.equal(p.opts.howdy, 'bar');
    assert.equal(p.cmds[0], 'asdf');
    assert.equal(p.cmds[1], 'qwer');
  }

, 'parse short null value': function () {
    var p = new Parser(_opts);
    p.parse(['-h']);
    assert.equal(p.opts.howdy.canon, null);
  }

, 'parse long null value': function () {
    var p = new Parser(_opts);
    p.parse(['--howdy']);
    assert.equal(p.opts.howdy.canon, null);
  }

, 'parse short not passed': function () {
    var p = new Parser(_opts);
    p.parse(['foo']);
    assert.equal(p.opts.howdy, undefined);
  }

, 'parse long not passed': function () {
    var p = new Parser(_opts);
    p.parse(['foo']);
    assert.equal(p.opts.howdy, undefined);
  }

, 'parse short doesn\'t exist': function () {
    var p = new Parser(_opts);
    try {
      p.parse(['-i', 'foo']);
    }
    catch (e) {
      assert.ok(e.message.indexOf('Unknown option') > -1);
    }
  }

, 'parse long doesn\'t exist': function () {
    var p = new Parser(_opts);
    try {
      p.parse(['--hello=bar']);
    }
    catch (e) {
      assert.ok(e.message.indexOf('Unknown option') > -1);
    }
  }

, 'long alias': function () {
    var p = new Parser(_opts);
    assert.equal(p.longOpts.derp, p.longOpts.zoom);
  }

, 'short alias': function () {
    var p = new Parser(_opts);
    assert.equal(p.shortOpts.n, p.shortOpts.b);
  }

};

module.exports = tests;

