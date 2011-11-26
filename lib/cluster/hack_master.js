var Master
  , master = require('./master')
  , MasterBase = master.Master
  , WorkerData = master.WorkerData
  , utils = require('../utils')
  , net = require('net')
  , childProcess = require('child_process')
  , binding = process.binding('net')
  , nodeBinary = process.argv[0];

Master = function () {};

// Inherit from normal Master
Master.prototype = geddy.mixin({}, MasterBase.prototype);
// Overrides
geddy.mixin(Master.prototype, new (function () {
  this.init = function () {
    this.workers = new geddy.SortedCollection();
    this._fd = binding.socket('tcp4');
    binding.bind(this._fd, parseInt('4000'));
    binding.listen(this._fd, 128);
  };

  this.createWorker = function () {
    var fds
      , w
      , data;
    // Create a pair of sockets that the master process and the
    // child will use to communicate
    // http://osr507doc.sco.com/en/netguide/dusockD.socketpairs_codetext.html
    // Credits: Ext's Connect, http://github.com/extjs/Connect
    fds = binding.socketpair();
    // Spawn the child process
    w = childProcess.spawn(nodeBinary, [__dirname+ '/server.js', 'true'],
        {customFds: [fds[1], -1, -1]});
    // Patch child's stdin
    if (!w.stdin) {
      w.stdin = new net.Stream(fds[0], 'unix');
    }
    w.stdout.addListener('data', function (data) {
      console.log(geddy.string.trim(data.toString()));
    });
    w.stdin.write('{}', 'ascii', this._fd);

    data = new WorkerData(w);
    data._fd = this._fd;
    this.workers.addItem(w.pid.toString(), data);

  };

})());

module.exports.Master = Master;

