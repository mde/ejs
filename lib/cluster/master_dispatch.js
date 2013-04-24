var file = require('utilities').file;

var dispatch = {
  readyForRetirement: function (msg) {
    this.killWorker(msg.workerId);
  }

, readyForShutdown: function (msg) {
    var id = msg.workerId;
    this.stdoutLog.notice('Killing worker ' + id + ' for graceful shutdown.');
    this.killWorker(id);
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

};

module.exports = dispatch;
