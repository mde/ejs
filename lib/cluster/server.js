var geddy = global.geddy = {}
  , cluster
  , binding
  , net
  , master
  , worker
  , fd
  , fds
  , w
  , config = {
      port: '4000'
    }
  , isMaster = false;

// Node 0.6
try {
  geddy.FD_HACK = false;
  cluster = require('cluster');
}
// Node 0.4
catch (e) {
  geddy.FD_HACK = true;
  net = require('net');
  childProcess = require('child_process');
  binding = process.binding('net');
}

master = require('./master');
worker = require('./worker');

if (geddy.FD_HACK) {
  if (!process.argv[2]) {
    isMaster = true;
  }

  if (isMaster) {
    console.log('master');
    fd = binding.socket('tcp4');
    binding.bind(fd, parseInt(config.port));
    binding.listen(fd, 128);

    // Creating the worker
    fds = binding.socketpair();
    // Spawn the child process
    w = childProcess.spawn('node', [__dirname+ '/server.js', 'true'],
        {customFds: [fds[1], -1, -1]});
    // Wait a moment, then patch child's stdin
    if (!w.stdin) {
      w.stdin = new net.Stream(fds[0], 'unix');
    }
    w.stdout.addListener('data', function (data) {
      console.log(data.toString());
    });
    w.stdin.write('testing ...', 'ascii', fd);

  }
  else {
    console.log('worker');
    w = new worker.Worker();
  }

}
else {
  if (cluster.isMaster) {
    isMaster = true;
  }

  if (isMaster) {
    console.log('master');

    // Creating the worker
    w = cluster.fork();
  }
  else {
    console.log('worker');
    w = new worker.Worker();
    w.configure(config);
    w.start();
  }

}
