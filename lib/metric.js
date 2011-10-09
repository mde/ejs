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
/**
* This is an adapter to send metrics messages from messagePassers to the master process
* messagePasser is likely a messagePasser
*/

// TODO: if metrics are turned off, make all of these noops

var Metric = exports = module.exports = function Metrics(messagePasser, eventType) {
  this.messagePasser = messagePasser;
  this.eventType = eventType;
}

Metric.prototype.newMetric = function(type, eventType) {
  this.messagePasser.sendMessage({
      method: 'createMetric'
    , type: type
    , eventType: eventType
  });
}

Metric.prototype.forwardMessage = function(method, args) { 
  this.messagePasser.sendMessage({
      method: 'updateMetric'
    , metricMethod: method
    , metricArgs: args
    , eventType: this.eventType
  });
}

Metric.prototype.update = function(val) { return this.forwardMessage('update', [val]); }
Metric.prototype.mark = function(n) { return this.forwardMessage('mark', [n]); }
Metric.prototype.inc = function(n) { return this.forwardMessage('inc', [n]); }
Metric.prototype.dec = function(n) { return this.forwardMessage('dec', [n]); }
Metric.prototype.clear = function() { return this.forwardMessage('clear'); }

// type must be one of: Timer, Histogram, Meter, Counter
module.exports.new = function(messagePasser, eventType, type) {
  var metric = new Metric(messagePasser, eventType);
  metric.newMetric(type, eventType);
  return metric;
}

