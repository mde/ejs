var assert = require('assert');
var path = require('path');
var proc = require('child_process');

suite('browser exports', function () {
  test('resolves the browser bundle for require and import', function () {
    var root = path.resolve(__dirname, '..');
    var resolved = proc.execFileSync(process.execPath, [
      '--conditions=browser', '-p', 'require.resolve("ejs")'
    ], {cwd: root}).toString().trim();
    assert.equal(resolved, path.join(root, 'ejs.min.js'));

    ['commonjs', 'module'].forEach(function (type) {
      var load = type === 'module' ?
        'import ejs from "ejs";' : 'const ejs = require("ejs");';
      var output = proc.execFileSync(process.execPath, [
        '--conditions=browser', '--input-type=' + type, '-e',
        load + 'console.log(ejs.render("<%= name %>", {name: "<>&"}));'
      ], {cwd: root}).toString().trim();
      assert.equal(output, '&lt;&gt;&amp;');
    });
  });
});
