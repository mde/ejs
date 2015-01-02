var buildOpts = {
  printStdout: true
, printStderr: true
};

task('build', ['browserify', 'minify'], function () {
  console.log('Build completed.');
});

task('browserify', {async: true}, function () {
  console.log('Browserifying...');
  jake.exec('./node_modules/browserify/bin/cmd.js lib/ejs.js > ejs.js',
      buildOpts, complete());
});

task('minify', {async: true}, function () {
  console.log('Minifying...');
  jake.exec('./node_modules/uglify-js/bin/uglifyjs ejs.js > ejs.min.js',
      buildOpts, complete());
});

testTask('ejs', function () {
  this.testFiles.include('test/**/*.js');
});

publishTask('ejs', ['build'], function () {
  this.packageFiles.include([
    'Jakefile'
  , 'README.md'
  , 'package.json'
  , 'ejs.js'
  , 'ejs.min.js'
  , 'lib/**'
  , 'test/**'
  ]);
});


