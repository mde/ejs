var geddy = global.geddy = {}
  , cluster
  , master
  , worker
  , m
  , w;

// Node 0.6
try {
  cluster = require('cluster');
  geddy.FD_HACK = false;
  worker = require('./worker');
  master = require('./master')
}
// Node 0.4
catch (e) {
  geddy.FD_HACK = true;
  worker = require('./hack_worker');
  master = require('./hack_master')
}

if ((cluster && cluster.isMaster) || (geddy.FD_HACK && !process.argv[2])) {
  m = new master.Master();
  m.start();
}
else {
  w = new worker.Worker();
}


