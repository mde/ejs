// Load the basic Geddy toolkit
require('./lib/geddy')

var fs = require('fs')
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

desc('Generate docs for Geddy');
task('doc', ['doc:generate']);

var p = new jake.NpmPublishTask('geddy', [
  'Makefile'
, 'Jakefile'
, 'README.md'
, 'package.json'
, 'bin/**'
, 'deps/**'
, 'lib/**'
, 'templates/**'
, 'test/**'
]);

// TODO: This is hacky -- need a better way to poke Jake to
// set up the package part included in the publish-task
jake.Task['npm:definePackage'].invoke();

testTask = new jake.TestTask('Geddy', function () {
  this.testName = 'testBase';
  this.testFiles.include('test/*.js');
  this.showDescription = false;
});

desc('Run the Geddy tests');
task('test', function () {
  var t = jake.Task.testBase;
  t.addListener('error', function (err) {
    var module
      , cmd
      , errMsg = err.message;

    if (errMsg.match('Cannot find module')) {
      module = errMsg.match(/'[a-zA-Z]*'/)[0].replace(/'/g, '')
      cmd = 'npm install ' + module;
      jake.logger.log(module + ' is not installed; Jake will attempt to install it for you.');
      jake.exec(cmd, function () {
        jake.logger.log('installed!');
        t.addListener('complete', function () {
          complete();
        });
        t.invoke();
      });
    }
    else {
      throw err;
    }
  });
  t.invoke();
}, {async: true});

testTask = new jake.TestTask('Geddy model-adapters', function () {
  this.testName = 'testModelAdapters'
  this.testFiles.include('lib/model/adapters/**/test.js');
});

