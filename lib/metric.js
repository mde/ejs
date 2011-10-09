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

