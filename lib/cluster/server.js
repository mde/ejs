var geddy = global.geddy = {}
  , cluster
  , master
  , worker
  , m
  , w;

// TODO: Remove Node 0.4 support
// Node 0.6
try {
  cluster = require('cluster');
  geddy.FD_HACK = false;
  master = require('./master')
  worker = require('./worker');
}
// Node 0.4
catch (e) {
  geddy.FD_HACK = true;
  master = require('./hack_master')
  worker = require('./hack_worker');
}

if ((cluster && cluster.isMaster) ||
    (geddy.FD_HACK && !process.argv[2])) {
  m = new master.Master();
  m.start();
}
else {
  w = new worker.Worker();
}


