// Load the basic Geddy toolkit
require('./lib/geddy')

var fs = require('fs')
  , path = require('path')
  , utils = require('utilities')
  , createPackageTask
  , JSPAT = /\.js$/
  , testTask;

namespace('doc', function () {
  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    jake.exec([cmd], function () {
      console.log('Done.');
      complete();
    });
  }, {async: true});

  task('clobber', function () {
    var cmd = 'rm -fr ./doc/**';
    jake.exec([cmd], function () {
      console.log('Clobbered old docs.');
      complete();
    });
  }, {async: true});

});

desc('Generate the geddy core files');
task('buildjs', function(){
  var cmd = 'browserify templates/build/build.js' +
            ' -o templates/base/public/js/core/core.js -i ./logger'
  jake.exec([cmd], function () {
    var msg = 'built templates/build/build.js to ' +
              'templates/base/public/js/core/core.js'
    console.log(msg);
    complete();
  })
}, {async: true});

desc('Generate docs for Geddy');
task('doc', ['doc:generate']);

var p = new jake.NpmPublishTask('geddy', function () {
  this.packageFiles.include([
    'Makefile'
  , 'Jakefile'
  , 'README.md'
  , 'package.json'
  , 'usage.txt'
  , 'bin/**'
  , 'deps/**'
  , 'lib/**'
  , 'gen/**'
  , 'test/**'
  ]);
  this.packageFiles.exclude([
    'test/tmp'
  ]);
});

testTask = new jake.TestTask('Geddy', function () {
  this.testName = 'testBase';
  // FIXME: The partial test fails when run too early. This "fix" sucks.
  this.testFiles.exclude('test/templates/partial.js');
  this.testFiles.include('test/**/*.js');
  this.testFiles.include('test/templates/partial.js');
  this.showDescription = false;
});

desc('Run the Geddy tests');
task('test', ['clean'], function () {
  var t = jake.Task.testBase;
  t.addListener('error', function (err) {
    var module
      , cmd
      , errMsg = err.message
      , match = errMsg.match('Cannot find module')
      , absModuleName = errMsg.match(/'[a-zA-Z]*'/);

    if (match && absModuleName) {
      module = absModuleName[0].replace(/'/g, '');
      cmd = 'npm install ' + module;
      jake.logger.log(module + ' is not installed; Jake will attempt to install it for you.');
      jake.exec(cmd, function () {
        jake.logger.log('installed!');
        t.addListener('complete', function () {
          complete();
        });
        t.invoke.apply(t, arguments);
      });
    }
    else {
      throw err;
    }
  });
  t.invoke.apply(t, arguments);
}, {async: true});

desc('Clears the test temp dir');
task('clean', function () {
  tmpDir = path.join(__dirname, 'test', 'tmp');
  utils.file.rmRf(tmpDir, {silent:true});
  fs.mkdirSync(tmpDir);
});
