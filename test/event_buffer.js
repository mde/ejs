// Load the basic Geddy toolkit
require('../lib/geddy');

var Stream = require('stream').Stream
  , EventEmitter = require('events').EventEmitter
  , EventBuffer = require('../lib/utils/event_buffer.js').EventBuffer
  , assert = require('assert')
  , tests;

tests = new (function () {

  this.testEventBuffer = function () {
    var source = new Stream()
      , dest1 = new EventEmitter()
      , dest2 = new EventEmitter();
    source.writeable = true;
    source.readable = true;
    var buff = new EventBuffer(source)
      , data1 = ''
      , data2 = '';
    source.emit('data', 'abcdef');
    source.emit('data', '123456');
    dest1.on('data', function(d) { data1 += d; });
    dest2.on('data', function(d) { data2 += d; });
    buff.addOutlet(dest1);
    buff.flush(dest2);
    assert.equal('abcdef123456', data1);
    assert.equal('abcdef123456', data2);
    source.emit('data', '---');
    assert.equal('abcdef123456---', data2);
  };

})();

for (var p in tests) {
  if (typeof tests[p] == 'function') {
    tests[p]();
  }
}


