/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

/*

This is a very simple buffer for a predetermined set of events. It is unbounded. 
It forwards all arguments to any outlet emitters attached with pipe().

Example:

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


*/

var EventBuffer = function(srcEmitter, events) {
  // By default, we service the default stream events
  var self = this
    , streamEvents = ['data', 'end', 'error', 'close', 'fd', 'drain', 'pipe'];
  this.events = events || streamEvents;
  this.emitter = srcEmitter;
  this.eventBuffer = [];
  this.outlets = [];
  for(var i = 0; i < this.events.length; i++) {
    (function(){
      var name = self.events[i]; // Close over the event name
      self.emitter.addListener(name, function() {
        self.addEvent(name, Array.prototype.slice.call(arguments));
      });
    })();
  }
};

EventBuffer.prototype = new (function() {
  this.addEvent = function(name, args) {
    if (this.outlets.length > 0) {
      this.emit(name, args)
    } else {
      this.eventBuffer.push({name: name, args: args});
    }
  };

  this.emit = function(name, args) {
    args.unshift(name);
    for(var i = 0; i < this.outlets.length; i++) {
      this.outlets[i].emit.apply(this.outlets[i], args);
    }
  };

  // Hook up as many output streams as you want
  this.addOutlet = function(destEmitter) {
    this.outlets.push(destEmitter);
  }

  // Flush the buffer and continue piping new events
  // destEmitter is optional and provided as a convenience to avoid unnecessary addOutlet calls
  this.flush = function(destEmitter) {
    if (destEmitter) {
      this.addOutlet(destEmitter);
    }
    for(var i = 0; i < this.eventBuffer.length; i++) {
      this.emit(this.eventBuffer[i].name, this.eventBuffer[i].args);
    }
    this.eventBuffer = [];
  };
});

module.exports.EventBuffer = EventBuffer;
