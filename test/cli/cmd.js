var assert = require('assert')
  , cmd = require('../../lib/cmd')
  , Cmd = cmd.Cmd
  , tests;

tests = {
  'Cmd parseArgs gen app defaults': function () {
    var c = new Cmd(['app', 'foo'], {});
    assert.equal('gen:app[foo,default,default]', c.jakeTaskName);
  }

, 'Cmd parseArgs gen app --jade': function () {
    var c = new Cmd(['app', 'foo', '--jade']);
    assert.equal('gen:app[foo,jade,default]', c.jakeTaskName);
  }

, 'Cmd parseArgs gen scaffold zooby foo bar --realtime': function () {
    var c = new Cmd(['scaffold', 'zooby', 'foo:int', 'bar:string',
            '--realtime']);
    assert.equal('gen:scaffold[zooby,foo:int%bar:string,default,realtime]',
        c.jakeTaskName);
  }
};

module.exports = tests;
