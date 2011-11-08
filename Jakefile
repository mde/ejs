var child_process = require('child_process')
  , exec = child_process.exec;

namespace('doc', function () {
  task('generate', function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
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
});

