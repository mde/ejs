let fs = require('fs');
let path = require('path');
let execSync = require('child_process').execSync;
let exec = function (cmd) {
  execSync(cmd, {stdio: 'inherit'});
};

/* global jake, task, desc, publishTask */

const FILE_SHIM = `
var __filename, __dirname;
if (typeof __filename == 'undefined') {
    __filename = (0, url_1.fileURLToPath)(import.meta.url);
}
if (typeof __dirname == 'undefined') {
    __dirname = path_1.default.dirname(__filename);
}
`.trim();

task('build', ['lint', 'clean', 'compile', 'browserify', 'minify'], function () {
  console.log('Build completed.');
});

desc('Compiles ESM to CJS source files');
task('compile', function () {
  // Compile CJS version
  exec('npx tsc');
  let source = fs.readFileSync('lib/cjs/ejs.js', 'utf8').toString();
  source = source.replace(FILE_SHIM, ''); // remove ESM shim for __filename and __dirname
  fs.writeFileSync('lib/cjs/ejs.js', source);
  fs.writeFileSync('lib/cjs/package.json', '{"type":"commonjs"}');
});

desc('Cleans browerified/minified files and package files');
task('clean', ['clobber'], function () {
  jake.rmRf('./ejs.js');
  jake.rmRf('./ejs.min.js');
  jake.rmRf('./lib/cjs');
  console.log('Cleaned up compiled files.');
});

desc('Lints the source code');
task('lint', ['clean'], function () {
  let epath = path.join('./node_modules/.bin/eslint');
  // Handle both ESM and CJS files in project
  exec(epath+' --config ./eslint.config_esm.mjs "lib/esm/*.js"');
  exec(epath+' --config ./eslint.config_cjs.mjs "test/*.js" "bin/cli.js" "jakefile.js"');
  console.log('Linting completed.');
});

task('browserify', function () {
  const currentDir = process.cwd();
  process.chdir('./lib/cjs');
  let epath = path.join('../../node_modules/browserify/bin/cmd.js');
  exec(epath+' --standalone ejs ejs.js > ../../ejs.js');
  process.chdir(currentDir);
  console.log('Browserification completed.');
});

task('minify', function () {
  let epath = path.join('./node_modules/uglify-js/bin/uglifyjs');
  exec(epath+' ./lib/cjs/ejs.js > ejs.min.js');
  console.log('Minification completed.');
});

desc('Generates the EJS API docs for the public API');
task('doc', function () {
  jake.rmRf('out');
  let epath = path.join('./node_modules/.bin/jsdoc');
  exec(epath+' --verbose -c jsdoc.json lib/* docs/jsdoc/*');
  console.log('Documentation generated in ./out.');
});

desc('Generates the EJS API docs for the public and private API');
task('devdoc', function () {
  jake.rmRf('out');
  let epath = path.join('./node_modules/.bin/jsdoc');
  exec(epath+' --verbose -p -c jsdoc.json lib/* docs/jsdoc/*');
  console.log('Documentation generated in ./out.');
});

desc('Publishes the EJS API docs');
task('docPublish', ['doc'], function () {
  fs.writeFileSync('out/CNAME', 'api.ejs.co');
  console.log('Pushing docs to gh-pages...');
  let epath = path.join('./node_modules/.bin/git-directory-deploy');
  exec(epath+' --directory out/');
  console.log('Docs published to gh-pages.');
});

desc('Runs the EJS test suite');
task('test', [], function () {
  exec(path.join('./node_modules/.bin/mocha --u tdd'));
});

publishTask('ejs', ['build'], function () {
  this.packageFiles.include([
    'jakefile.js',
    'README.md',
    'LICENSE',
    'package.json',
    'ejs.js',
    'ejs.min.js',
    'lib/**',
    'bin/**',
    'usage.txt'
  ]);
});

jake.Task.publish.on('complete', function () {
  console.log('Updating hosted docs...');
  console.log('If this fails, run jake docPublish to re-try.');
  jake.Task.docPublish.invoke();
});
