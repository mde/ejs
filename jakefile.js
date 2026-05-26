let fs = require('fs');
let path = require('path');
let os = require('os');
let proc = require('child_process');
let execSync = proc.execSync;
let exec = function (cmd) {
  execSync(cmd, {stdio: 'inherit'});
};

/* global jake, task, desc, namespace, publishTask */

// Hook into some of the publish lifecycle events
jake.on('finished', function (ev) {

  switch (ev.name) {
  case 'publish':
    console.log('Updating hosted docs...');
    console.log('If this fails, run jake docPublish to re-try.');
    jake.Task.docPublish.invoke();
    break;
  default:
      // Do nothing
  }

});

desc('Builds the EJS library');
task('build', ['lint', 'clean', 'compile', 'browserify', 'minify']);

desc('Compiles ESM to CJS source files');
task('compile', function () {
  // Compile CJS version
  exec('npx tsc');
  let source = fs.readFileSync('lib/cjs/ejs.js', 'utf8').toString();
  // Browerify chokes on the 'node:' prefix in require statements
  // Added the 'node:' prefix to ESM for Deno compat
  ['fs', 'path', 'url'].forEach((mod) => {
    source = source.replace(`require("node:${mod}")`, `require("${mod}")`);
    source = source.replace(new RegExp(`node_${mod}_1`, 'g'), `${mod}_1`);
  });
  // replace `let` in code-generation strings
  source = source.replace(
    "var DECLARATION_KEYWORD = 'let';",
    "var DECLARATION_KEYWORD = 'var';"
  );
  // Preserve `require('ejs') === ejs` (and same for utils) by rewriting
  // tsc's `exports.default = X` to `module.exports = X` in the CJS build.
  // The ESM source no longer carries a dual-export hack (bundlers and
  // strict-ESM runtimes choke on `module.exports` in an ESM file).
  source = source.replace(/^exports\.default = ejs;\s*$/m, 'module.exports = ejs;');
  fs.writeFileSync('lib/cjs/ejs.js', source);
  let utilsSource = fs.readFileSync('lib/cjs/utils.js', 'utf8').toString();
  utilsSource = utilsSource.replace(/^exports\.default = utils;\s*$/m,
    'module.exports = utils;');
  fs.writeFileSync('lib/cjs/utils.js', utilsSource);
  let parseargsSource = fs.readFileSync('lib/cjs/parseargs.js', 'utf8').toString();
  parseargsSource = parseargsSource.replace(/^exports\.default = parseargs;\s*$/m,
    'module.exports = parseargs;');
  fs.writeFileSync('lib/cjs/parseargs.js', parseargsSource);
  fs.writeFileSync('lib/cjs/package.json', '{"type":"commonjs"}');
});

desc('Cleans browerified/minified files and package files');
task('clean', ['clobber'], function () {
  fs.rmSync('./ejs.js', {force: true});
  fs.rmSync('./ejs.min.js', {force: true});
  fs.rmSync('./lib/cjs', {recursive: true, force: true});
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
  exec(epath+' ./ejs.js > ejs.min.js');
  console.log('Minification completed.');
});

desc('Generates the EJS API docs for the public API');
task('doc', function () {
  fs.rmSync('out', {recursive: true, force: true});
  let epath = path.join('./node_modules/.bin/jsdoc');
  exec(epath+' --verbose -c jsdoc.json lib/esm/* docs/jsdoc/*');
  console.log('Documentation generated in ./out.');
});

desc('Generates the EJS API docs for the public and private API');
task('devdoc', function () {
  fs.rmSync('out', {recursive: true, force: true});
  let epath = path.join('./node_modules/.bin/jsdoc');
  exec(epath+' --verbose -p -c jsdoc.json lib/esm/* docs/jsdoc/*');
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
task('test', ['test:unit'], function () {});

desc('Runs the EJS test suite without rebuilding');
task('testOnly', function () {
  exec(path.join('./node_modules/.bin/mocha --u tdd'));
});

namespace('test', function () {
  desc('Runs the EJS unit test suite');
  task('unit', ['build', 'testOnly'], function () {});

  desc('Runs package compatibility tests against the release tarball');
  task('packaging', ['publish:package'], function () {
    let version = require('./package.json').version;
    let packagePath = path.resolve('pkg', 'ejs-v' + version + '.tar.gz');
    let fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ejs-package-test-'));
    let npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    if (!fs.existsSync(packagePath)) {
      throw new Error('Package tarball not found: ' + packagePath);
    }

    try {
      fs.writeFileSync(path.join(fixtureDir, 'package.json'), JSON.stringify({
        private: true,
        type: 'module'
      }, null, 2));

      proc.execFileSync(npmCmd, ['install', '--no-audit', '--no-fund', packagePath],
        {cwd: fixtureDir, stdio: 'inherit'});

      fs.writeFileSync(path.join(fixtureDir, 'cjs-smoke.cjs'), [
        'const assert = require("assert");',
        'const ejs = require("ejs");',
        'assert.equal(typeof ejs.render, "function");',
        'assert.equal(ejs.render("<%= name %>", {name: "<>&"}), "&lt;&gt;&amp;");',
        ''
      ].join('\n'));
      proc.execFileSync(process.execPath, ['cjs-smoke.cjs'],
        {cwd: fixtureDir, stdio: 'inherit'});

      fs.writeFileSync(path.join(fixtureDir, 'esm-smoke.mjs'), [
        'import assert from "node:assert/strict";',
        'import ejs from "ejs";',
        'assert.equal(typeof ejs.render, "function");',
        'assert.equal(ejs.render("<%= name %>", {name: "<>&"}), "&lt;&gt;&amp;");',
        ''
      ].join('\n'));
      proc.execFileSync(process.execPath, ['esm-smoke.mjs'],
        {cwd: fixtureDir, stdio: 'inherit'});

      fs.writeFileSync(path.join(fixtureDir, 'template.ejs'), 'Hello <%= name %>');
      let cliOutput = proc.execFileSync(process.execPath, [
        path.join(fixtureDir, 'node_modules/ejs/bin/cli.js'),
        'template.ejs',
        'name=EJS'
      ], {cwd: fixtureDir}).toString();

      if (cliOutput !== 'Hello EJS') {
        throw new Error('Unexpected CLI output: ' + cliOutput);
      }
    }
    finally {
      fs.rmSync(fixtureDir, {recursive: true, force: true});
    }

    console.log('Package compatibility tests completed.');
  });

  desc('Runs all EJS tests');
  task('full', ['test:unit', 'test:packaging'], function () {});
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
