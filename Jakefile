
var fs = require('fs')
  , pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString())
  , version = pkg.version
  , child_process = require('child_process')
  , exec = child_process.exec;

namespace('app', function () {
  desc('Creates a new Geddy app scaffold.');
  task('create', [], function (appName) {
    if (!appName) {
      throw new Error('No app-name specified.');
    }
    var dir = appName
      , templateDir = __dirname + '/templates/base'
      , cmds = [
          'mkdir -p ./' + dir
        , 'mkdir -p ./' + dir + '/config'
        , 'mkdir -p ./' + dir + '/app/models'
        , 'mkdir -p ./' + dir + '/app/controllers'
        , 'mkdir -p ./' + dir + '/app/views'
        , 'mkdir -p ./' + dir + '/public'
        , 'mkdir -p ./' + dir + '/public/js'
        , 'mkdir -p ./' + dir + '/public/css'
        , 'mkdir -p ./' + dir + '/log'
        , 'cp ' + templateDir + '/router.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/init.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/environment.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/development.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/production.js ' + dir + '/config/'
        , 'cp ' + templateDir + '/main.js ' + dir + '/app/controllers/'
        , 'cp ' + templateDir + '/application.js ' + dir + '/app/controllers/'
        , 'cp ' + templateDir + '/master.css ' + dir + '/public/css/'
        , 'cp ' + templateDir + '/favicon.ico ' + dir + '/public/'
        ];
    runCmds(cmds, function () {
      console.log('Created app ' + dir + '.');
    });
  });
});

namespace('doc', function () {
  desc('Generate docs for Geddy');
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      if (stderr) {
        console.log(stderr);
      }
      if (stdout) {
        console.log(stdout);
      }
      console.log('Done.');
      complete();
    });
  }, true);

  desc('Clobber the generated docs.');
  task('clobber', function () {
    var cmd = 'rm -fr ./doc/*';
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      if (stderr) {
        console.log(stderr);
      }
      if (stdout) {
        console.log(stdout);
      }
      console.log('Clobbered old docs.');
      complete();
    });
  }, true);

});

// Runs an array of shell commands asynchronously, calling the
// next command off the queue inside the callback from child_process.exec.
// When the queue is done, call the final callback function.
var runCmds = function (arr, callback, printStdout) {
  var run = function (cmd) {
    child_process.exec(cmd, function (err, stdout, stderr) {
      if (err) {
        console.log('Error: ' + JSON.stringify(err));
      }
      else if (stderr) {
        console.log('Error: ' + stderr);
      }
      else {
        if (printStdout) {
          console.log(stdout);
        }
        if (arr.length) {
          var next = arr.shift();
          run(next);
        }
        else {
          if (callback) {
            callback();
          }
        }
      }
    });
  };
  run(arr.shift());
};

var t = new jake.PackageTask('geddy', 'v' + version, function () {
  // Preface with __dirname, will still resolve FileList when
  // run outside of project dir for generator-tasks
  var fileList = [
    __dirname + '/Makefile'
  , __dirname + '/Jakefile'
  , __dirname + '/README.md'
  , __dirname + '/package.json'
  , __dirname + '/bin/*'
  , __dirname + '/deps/*'
  , __dirname + '/lib/*'
  , __dirname + '/templates/*'
  ];
  this.packageFiles.include(fileList);
  this.needTarGz = true;
  this.needTarBz2 = true;
});


