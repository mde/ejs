var sys = require('sys');

exports.tasks = {
  'default': {
    'desc': 'Installs the Geddy Web-app development framework',
    'deps': [],
    'task': function (env) {
      var cmds = [
        'mkdir -p ~/.node_libraries/geddy',
        'cp -R ./dist/* ~/.node_libraries/geddy/',
        'cp scripts/geddy-gen /usr/local/bin/',
        'cp scripts/geddy /usr/local/bin/'
      ];
      runCmds(cmds, function () {
        sys.puts('Geddy installed.');
      });
    }
  },

  'app': {
    'desc': 'Creates a new Geddy app scaffold.',
    'deps': [],
    'task': function (env) {
      var dir = env.appName;
      var cmds = [
        'mkdir -p ./' + dir,
        'mkdir -p ./' + dir + '/config',
        'mkdir -p ./' + dir + '/app/controllers',
        'mkdir -p ./' + dir + '/public',
        'cp ~/.node_libraries/geddy/scripts/gen/router.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy/scripts/gen/main.js ' + dir + '/app/controllers/'
      ]
      runCmds(cmds, function () {
        sys.puts('Created app ' + dir + '.');
      });
    }
  },
  
  'resource': {
    
  }

};

// Runs an array of shell commands asynchronously, calling the
// next command off the queue inside the callback from sys.exec.
// When the queue is done, call the final callback function.
var runCmds = function (arr, callback) {
  var run = function (cmd) {
    sys.exec(cmd, function (err, stdout, stderr) {
      if (err) {
        sys.puts('Error: ' + JSON.stringify(err));
      }
      else if (stderr) {
        sys.puts('Error: ' + stderr);
      }
      else {
        if (arr.length) {
          var next = arr.shift();
          run(next);
        }
        else {
          callback();
        }
      }
    });
  };
  run(arr.shift());
};

