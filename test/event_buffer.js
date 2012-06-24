// Load the basic Geddy toolkit
require('../lib/geddy');

var Stream = require('stream').Stream
  , EventEmitter = require('events').EventEmitter
  , EventBuffer = require('../lib/utils/event_buffer.js').EventBuffer
  , assert = require('assert')
  , tests;

tests = {

  'test basic event buffer functionality': function () {
    var source = new Stream()
      , dest = new EventEmitter()
      , buff = new EventBuffer(source)
      , data = '';
    dest.on('data', function(d) { data += d; });
    source.writeable = true;
    source.readable = true;
    source.emit('data', 'abcdef');
    source.emit('data', '123456');
    buff.sync(dest);
    assert.equal('abcdef123456', data);
    source.emit('data', '---');
    assert.equal('abcdef123456---', data);
  }

};

module.exports = tests;
