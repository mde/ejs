var execSync = require('child_process').execSync;
var exec = function (cmd) {
  execSync(cmd, {stdio: 'inherit'});
};

/* global jake, task, desc, publishTask */

task('build', ['lint', 'clean', 'browserify', 'minify'], function () {
  console.log('Build completed.');
});

desc('Cleans browerified/minified files and package files');
task('clean', ['clobber'], function () {
  jake.rmRf('./ejs.js');
  jake.rmRf('./ejs.min.js');
  console.log('Cleaned up compiled files.');
});

task('lint', function () {
  exec('./node_modules/.bin/eslint \"**/*.js\" Jakefile');
  console.log('Linting completed.');
});

task('browserify', function () {
  exec('./node_modules/browserify/bin/cmd.js --standalone ejs lib/ejs.js > ejs.js');
  console.log('Browserification completed.');
});

task('minify', function () {
  exec('./node_modules/uglify-js/bin/uglifyjs ejs.js > ejs.min.js');
  console.log('Minification completed.');
});

publishTask('ejs', ['build'], function () {
  this.packageFiles.include([
    'Jakefile',
    'README.md',
    'LICENSE',
    'package.json',
    'ejs.js',
    'ejs.min.js',
    'lib/**',
    'test/**'
  ]);
});
