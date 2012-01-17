
var dispatch = {
  readyForShutdown: function (msg) {
    this.killWorker(msg.workerId);
    this.checkShutdown();
  }

, log: function (msg) {
    // If for some reason, there's no logType, assume debug?
    var type = msg.logType || 'debug'
    // Map log-levels to the different logs
      , typeMap = {
          'debug': 'stdout'
        , 'info': 'stdout'
        , 'notice': 'stdout'
        , 'warning': 'stderr'
        , 'error': 'stderr'
        , 'critical': 'stderr'
        , 'alert': 'stderr'
        , 'emergency': 'stderr'
        , 'access': 'access'
        }
    // access/error have their own loggers, everything else
    // goes to stdoutLog
      , logger = this[typeMap[type] + 'Log'];

    if (!logger) {
      throw new Error('"' + type + '" is not a valid logger.');
    }

    logger[type](msg.message);
  }

, heartbeat: function (msg) {
    var workerData = this.workers.getItem(msg.workerId);
    workerData.heartbeatAt = (new Date()).getTime();
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
