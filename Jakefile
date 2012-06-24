// Load the basic Geddy toolkit
require('./lib/geddy')

var fs = require('fs')
  , createPackageTask
  , JSPAT = /\.js$/;

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

desc('Runs the tests.');
task('test', function () {
  var dir = process.cwd()
    , dirList = fs.readdirSync(dir + '/test')
    , fileName
    , cmds = [];
  for (var i = 0; i < dirList.length; i++) {
    fileName = dirList[i];
    // Any files ending in '.js'
    if (JSPAT.test(fileName)) {
      cmds.push('node ./test/' + fileName);
    }
  }
  jake.exec(cmds, function () {
    console.log('Tests passed.');
    complete();
  }, {stdout: true});
}, {async: true});

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

var t = jake.TestTask('Geddy model-adapters', function () {
  this.testName = 'testModelAdapters'
  this.testFiles.include('lib/model/adapters/**/test.js');
});

