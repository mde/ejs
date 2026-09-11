let exec = require('child_process').execSync;
let execFile = require('child_process').execFileSync;
let fs = require('fs');
let path = require('path');
let assert = require('assert');
let os = process.platform !== 'win32' ? '' : 'node ';
let lf = process.platform !== 'win32' ? '\n' : '\r\n';

function run(cmd) {
  return exec(cmd).toString();
}

suite('cli', function () {
  suite('skip unchanged output', function () {
    let dir;
    let template;
    let output;
    let oldTime = new Date('2000-01-01T00:00:00Z');

    setup(function () {
      dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ejs-cli-'));
      template = path.join(dir, 'template.ejs');
      output = path.join(dir, 'output.html');
      fs.writeFileSync(template, 'Hello <%= name %>');
    });

    teardown(function () {
      fs.unlinkSync(template);
      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }
      fs.rmdirSync(dir);
    });

    function render(extra) {
      return execFile(process.execPath, ['bin/cli.js', template, 'name=world'].concat(extra)).toString();
    }

    test('preserves the modification time of identical output', function () {
      fs.writeFileSync(output, 'Hello world');
      fs.utimesSync(output, oldTime, oldTime);
      render(['--skip-unchanged', '-o', output]);
      assert.equal(fs.statSync(output).mtimeMs, oldTime.getTime());
      assert.equal(fs.readFileSync(output, 'utf8'), 'Hello world');
    });

    test('writes changed output', function () {
      fs.writeFileSync(output, 'Old content');
      fs.utimesSync(output, oldTime, oldTime);
      render(['--skip-unchanged', '-o', output]);
      assert.equal(fs.readFileSync(output, 'utf8'), 'Hello world');
      assert.notEqual(fs.statSync(output).mtimeMs, oldTime.getTime());
    });

    test('creates missing output', function () {
      render(['--skip-unchanged', '-o', output]);
      assert.equal(fs.readFileSync(output, 'utf8'), 'Hello world');
    });

    test('compares bytes rather than decoded text', function () {
      fs.writeFileSync(template, '\uFFFD');
      fs.writeFileSync(output, Buffer.from([0xFF]));
      render(['--skip-unchanged', '-o', output]);
      assert.deepEqual(fs.readFileSync(output), Buffer.from('\uFFFD'));
    });

    test('still rewrites identical output by default', function () {
      fs.writeFileSync(output, 'Hello world');
      fs.utimesSync(output, oldTime, oldTime);
      render(['-o', output]);
      assert.notEqual(fs.statSync(output).mtimeMs, oldTime.getTime());
    });

    test('does not change stdout output', function () {
      assert.equal(render(['--skip-unchanged']), 'Hello world');
    });

    test('reports output read errors', function () {
      assert.throws(function () {
        render(['--skip-unchanged', '-o', dir]);
      });
      assert.ok(fs.statSync(dir).isDirectory());
    });
  });

  test('rendering, custom delimiter, passed data', function () {
    let x = path.join('./bin/cli.js');
    let u = path.join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ '+u+' name=foo');
    assert.equal(o, '<h1>foo</h1>'+lf);
  });

  test('rendering, custom delimiter, data from file with -f', function () {
    let x = path.join('./bin/cli.js');
    let u = path.join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -f ./test/fixtures/user_data.json '+u);
    assert.equal(o, '<h1>zerb</h1>'+lf);
  });

  test('rendering, custom delimiter, data from CLI arg with -i', function () {
    let x = path.join('./bin/cli.js');
    let u = path.join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -i %7B%22name%22%3A%20%22foo%22%7D '+u);
    assert.equal(o, '<h1>foo</h1>'+lf);
  });

  test('rendering, custom delimiter, data from stdin / pipe', function () {
    if ( process.platform !== 'win32' ) {
      let o = run('cat ./test/fixtures/user_data.json | ./bin/cli.js -m $ ./test/fixtures/user.ejs');
      assert.equal(o, '<h1>zerb</h1>\n');
    } // does not work on windows...
  });

  test('rendering, custom delimiter, passed data overrides file', function () {
    let x = path.join('./bin/cli.js');
    let f = path.join('./test/fixtures/user_data.json');
    let g = path.join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -f '+f+' '+g+' name=frang');
    assert.equal(o, '<h1>frang</h1>'+lf);
  });

  test('rendering, remove whitespace option (hyphen case)', function () {
    let x = path.join('./bin/cli.js');
    let f = path.join('./test/fixtures/rmWhitespace.ejs');
    let o = run(os+x+' --rm-whitespace '+f);
    let c = fs.readFileSync('test/fixtures/rmWhitespace.html', 'utf-8');
    assert.equal(o.replace(/\n/g, lf), c);
  });

  test('relative path in nested include', function () {
    let x = path.join('./bin/cli.js');
    let u = path.join('test/fixtures/include-simple.ejs');
    let o = run(os+x+' '+u);
    let c = fs.readFileSync('test/fixtures/include-simple.html', 'utf-8');
    assert.equal(o, c);
  });

});
