var assert = require('assert')
  , parseopts = require('../lib/parseopts')
  , Parser = parseopts.Parser
  , tests;

tests = new function () {
  var _opts = [
    {
    full: 'howdy'
    , abbr: 'h'
    }
  ];

  this.testConstrutor = function () {
    var p = new Parser(_opts);
    assert.equal(p.longOpts.howdy.full, 'howdy');
    assert.equal(p.shortOpts.h.full, 'howdy');
  };

  this.testParseShort = function () {
    var p = new Parser(_opts);
    p.parse(['-h', 'foo']);
    assert.equal(p.opts.howdy, 'foo');
  };

  this.testParseLong = function () {
    var p = new Parser(_opts);
    p.parse(['--howdy=bar']);
    assert.equal(p.opts.howdy, 'bar');
  };

  this.testParseShortWithCmds = function () {
    var p = new Parser(_opts);
    p.parse(['asdf', '-h', 'foo', 'qwer']);
    assert.equal(p.opts.howdy, 'foo');
    assert.equal(p.cmds[0], 'asdf');
    assert.equal(p.cmds[1], 'qwer');
  };

  this.testParseShortWithCmds = function () {
    var p = new Parser(_opts);
    p.parse(['asdf', '--howdy=bar', 'qwer']);
    assert.equal(p.opts.howdy, 'bar');
    assert.equal(p.cmds[0], 'asdf');
    assert.equal(p.cmds[1], 'qwer');
  };

  this.testParseShortNullValue = function () {
    var p = new Parser(_opts);
    p.parse(['-h']);
    assert.equal(p.opts.howdy.full, null);
  };

  this.testParseLongNullValue = function () {
    var p = new Parser(_opts);
    p.parse(['--howdy']);
    assert.equal(p.opts.howdy.full, null);
  };

  this.testParseShortNotPassed = function () {
    var p = new Parser(_opts);
    p.parse(['foo']);
    assert.equal(p.opts.howdy, undefined);
  };

  this.testParseLongNotPassed = function () {
    var p = new Parser(_opts);
    p.parse(['foo']);
    assert.equal(p.opts.howdy, undefined);
  };

  this.testParseShortDoesntExist = function () {
    var p = new Parser(_opts);
    try {
      p.parse(['-i', 'foo']);
    }
    catch (e) {
      assert.ok(e.message.indexOf('Unknown option') > -1);
    }
  };

  this.testParseLongDoesntExist = function () {
    var p = new Parser(_opts);
    var p = new Parser(_opts);
    try {
      p.parse(['--hello=bar']);
    }
    catch (e) {
      assert.ok(e.message.indexOf('Unknown option') > -1);
    }
  };

}();

module.exports = tests;

