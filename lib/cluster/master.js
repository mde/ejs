var Master
  , cluster
  , utils = require('../utils');

if (!geddy.FD_HACK) {
  cluster = require('cluster');
}

Master = function () {
  this.init();
};

Master.prototype = new (function () {
  this.init = function () {
    this.workers = new geddy.SortedCollection();
  };

  this.start = function () {
    this.createWorker();
  };

  this.createWorker = function () {
    var w = cluster.fork()
      , data = new WorkerData(w);
    this.workers.addItem(w.pid.toString(), data);
  };

})();

WorkerData = function (process) {
  //var retireAt = (new Date()).getTime() + this.config.rotationWindow
  var retireAt = (new Date()).getTime() + 1000*60*60*4; // Four hours?
  this.retireAt = retireAt;
  this.heartbeatAt = (new Date()).getTime();
  this.process = null;
  this.pid = null;
  this.retired = false;
  this.process = process;
};

module.exports.Master = Master;
module.exports.WorkerData = WorkerData;
