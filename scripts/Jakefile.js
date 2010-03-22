var sys = require('sys');

exports.tasks = {
  'default': {
    'desc': 'Installs the Geddy Web-app development framework',
    'task': function (env) {
      sys.puts('Installing Geddy ...');
      var cmds = [
        'mkdir -p ~/.node_libraries/geddy',
        'cp -R lib ~/.node_libraries/geddy/',
        'cp -R scripts ~/.node_libraries/geddy/',
        'cp scripts/geddy-gen /usr/local/bin/',
        'cp scripts/geddy /usr/local/bin/'
      ];
      runCmds(cmds);
    }
  },

  'app': {
    'desc': 'Creates a new Geddy app scaffold.',
    'task': function (env) {
      var dir = env.appName;
      sys.puts('Creating app ' + dir);
      var cmds = [
        'mkdir -p ./' + dir,
        'mkdir -p ./' + dir + '/config',
        'mkdir -p ./' + dir + '/app/controllers',
        'mkdir -p ./' + dir + '/public',
        'cp ~/.node_libraries/geddy/scripts/gen/router.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy/scripts/gen/main.js ' + dir + '/app/controllers/'
      ]
      runCmds(cmds);
    }
  }

};

var runCmds = function (arr) {
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
        }
      }
    });
  };
  run(arr.shift());
};

