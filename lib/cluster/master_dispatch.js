
var dispatch = {
  readyForShutdown: function (msg) {
    this.killWorker(msg.workerId);
    this.checkShutdown();
  }

, log: function (msg) {
    // If for some reason, there's no logType, assume debug?
    var type = msg.logType || 'debug'
    // access/error have their own loggers, everything else
    // goes to stdoutLog
      , logger = this[type + 'Log'] || this.stdoutLog;

    logger[type](msg.message);
  }

, heartbeat: function (msg) {
    var worker = this.workers.getItem(msg.workerId);
    worker.heartbeatAt = (new Date()).getTime();
  }

, error: function (msg) {
    this.stderrLog.error('Caught error-message from child-process.');
    this.stderrLog.error(msg.data.stack);
    this.killWorker(msg.workerId);
  }

/*
, createMetric: function (msg) {
    if (server.metricsServer) {
      msg.type = msg.type[0].toUpperCase() + msg.type.substring(1)
      server.metricsServer.addMetric(msg.eventType, new metrics[msg.type]);
    }
  }

, updateMetric: function (msg) {
    if (server.metricsServer) {
      var namespaces = msg.eventType.split('.')
        , event = namespaces.pop()
        , namespace = namespaces.join('.');
      var metric = server.metricsServer.trackedMetrics[namespace][event];
      metric[msg.metricMethod].apply(metric, msg.metricArgs);
    }
  }
*/

};

module.exports = dispatch;
