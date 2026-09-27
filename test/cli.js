let exec = require('child_process').execSync;
let spawnSync = require('child_process').spawnSync;
let fs = require('fs');
let path = require('path');
let assert = require('assert');
let os = process.platform !== 'win32' ? '' : 'node ';
let lf = process.platform !== 'win32' ? '\n' : '\r\n';

function run(cmd) {
  return exec(cmd).toString();
}

suite('cli', function () {
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

/*
 * Error / exit-code / edge / timing behavior for the reworked CLI.
 * RED until bin/cli.js + parseargs.js are updated (see cli-parser-plan.md).
 * Exit codes: 2 = usage error, 1 = runtime failure, 0 = success (incl help/version).
 */
let spawn = require('child_process').spawn;

let USER = './test/fixtures/user.ejs';   // $-delimited: <h1><$= name $></h1>
let DATA = './test/fixtures/user_data.json';

// spawnSync with a hard timeout so a stdin-EOF regression can't hang the suite
// (Mocha's timeout cannot interrupt a synchronous call). No shell, so args like
// -m|, --bogus, --constructor pass literally and a nonzero exit does not throw.
function cli(args, opts) {
  opts = opts || {};
  let r = spawnSync(process.execPath, ['./bin/cli.js'].concat(args), {
    encoding: 'utf8',
    timeout: 10000,
    killSignal: 'SIGKILL',
    input: Object.prototype.hasOwnProperty.call(opts, 'input') ? opts.input : '',
  });
  // A timeout kills via signal and leaves status null; surface it rather than
  // letting a bogus status assertion accidentally pass.
  assert.ok(!r.error, 'spawn error: ' + (r.error && r.error.message));
  assert.strictEqual(r.signal, null, 'child killed by signal ' + r.signal + ' (hang?)');
  return r;
}

// stderr diagnostics must be human messages, not raw V8 stack traces.
function assertNoStackTrace(s) {
  assert.ok(!/\n\s+at\s/.test(s), 'stderr contains a stack trace:\n' + s);
}

suite('cli errors and edges', function () {

  // ejs #690: attached short value works, same as the spaced form.
  test('attached delimiter -m$ renders like -m $', function () {
    let r = cli(['-m$', USER, 'name=foo']);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), '<h1>foo</h1>');
    assert.equal(r.stderr, '');
  });

  // ejs #690: unknown option is an error, not silently ignored.
  test('unknown option -> exit 2, diagnostic on stderr, empty stdout', function () {
    let r = cli(['--bogus', '-m$', USER, 'name=foo']);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /bogus/);
    assertNoStackTrace(r.stderr);
    assert.equal(r.stdout, '');
  });

  test('missing required value -> exit 2, no stack trace', function () {
    let r = cli([USER, '-o']);
    assert.equal(r.status, 2);
    assertNoStackTrace(r.stderr);
  });

  // Codex: inherited property names must not sneak through as options.
  test('--constructor -> exit 2 unknown option (no silent opts.undefined)', function () {
    let r = cli(['--constructor', '-m$', USER, 'name=foo']);
    assert.equal(r.status, 2);
    assertNoStackTrace(r.stderr);
  });

  // help wins over an unknown option; usage on stdout, stderr empty.
  test('help precedence: -h --bogus -> usage on stdout, exit 0, empty stderr', function () {
    let r = cli(['-h', '--bogus']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /output-file/);   // real usage text, not the error
    assert.equal(r.stderr, '');
  });

  // ---- data sources: conflict + first-'=' split (Codex #6) -----------------

  // stdin is the fallback base: an explicit -f wins and stdin is not read
  // (this is also why the CLI never blocks on stdin when data came another way).
  test('-f present: stdin ignored, renders from -f', function () {
    let r = cli(['-m$', '-f', DATA, USER], { input: '{"name":"x"}' });
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), '<h1>zerb</h1>');
  });

  test('conflict counts presence not truthiness: empty --data-input= + -f -> exit 2', function () {
    let r = cli(['-m$', '--data-input=', '-f', DATA, USER]);
    assert.equal(r.status, 2);
  });

  test('conflict: -i and -f -> exit 2', function () {
    let r = cli(['-m$', '-i', '%7B%7D', '-f', DATA, USER]);
    assert.equal(r.status, 2);
  });

  test("name=a=b splits on first '=' -> value 'a=b'", function () {
    let r = cli(['-m', '$', USER, 'name=a=b']);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), '<h1>a=b</h1>');
  });

  test("'--' does not change data classification: name=a=b after -- still data", function () {
    let r = cli(['-m', '$', USER, '--', 'name=a=b']);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), '<h1>a=b</h1>');
  });

  // ---- runtime failures: exit 1, real diagnostic, no stack, empty stdout ---

  test('invalid JSON via -i -> exit 1, diagnostic, no stack, empty stdout', function () {
    let r = cli(['-m$', '-i', 'not-json', USER]);
    assert.equal(r.status, 1);
    assert.notEqual(r.stderr.trim(), '');
    assertNoStackTrace(r.stderr);
    assert.equal(r.stdout, '');
  });

  test('invalid JSON on stdin -> exit 1, no stack', function () {
    let r = cli(['-m$', USER], { input: 'not json' });
    assert.equal(r.status, 1);
    assertNoStackTrace(r.stderr);
  });

  test('no template -> exit 2', function () {
    let r = cli([]);
    assert.equal(r.status, 2);
  });

  // Template is always first; data before it is the likely-reversed case.
  test('data before template -> exit 2 with a helpful message', function () {
    let r = cli(['-m$', 'name=foo', USER]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /template path must come first/i);
  });

  test('stray non-data operand after template -> exit 2', function () {
    let r = cli(['-m$', USER, 'extra.ejs']);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /unexpected argument/i);
  });

  // ---- output not truncated on exit (Codex #4) -----------------------------
  // 100k > pipe buffer; process.exit() mid-write would truncate. Compare full length.
  test('large output is not truncated', function () {
    let big = 'x'.repeat(100000);
    let r = cli(['-m', '$', USER, 'name=' + big]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), '<h1>' + big + '</h1>');
  });

});

// ---- stdin timing: async, with deadlines (Codex #1/#4) ---------------------
// Real async spawn so we can delay/split stdin and prove the CLI waits for EOF
// (not setImmediate) and that help exits without waiting on stdin.
suite('cli stdin timing', function () {

  function spawnCli(args) {
    return spawn(process.execPath, ['./bin/cli.js'].concat(args));
  }

  function collect(child, cb) {
    let out = '', err = '';
    child.stdout.on('data', function (d) { out += d; });
    child.stderr.on('data', function (d) { err += d; });
    child.on('close', function (code) { cb(code, out, err); });
  }

  test('waits for delayed stdin data', function (done) {
    let child = spawnCli(['-m', '$', USER]);
    collect(child, function (code, out) {
      try {
        assert.equal(code, 0);
        assert.equal(out.trim(), '<h1>delayed</h1>');
        done();
      } catch (e) { done(e); }
    });
    setTimeout(function () { child.stdin.end('{"name":"delayed"}'); }, 100);
  });

  test('reassembles split stdin chunks', function (done) {
    let child = spawnCli(['-m', '$', USER]);
    collect(child, function (code, out) {
      try {
        assert.equal(code, 0);
        assert.equal(out.trim(), '<h1>split</h1>');
        done();
      } catch (e) { done(e); }
    });
    child.stdin.write('{"name":');
    setTimeout(function () { child.stdin.end('"split"}'); }, 100);
  });

  test('help exits promptly without waiting for stdin EOF', function (done) {
    let child = spawnCli(['-h']);
    let finished = false;
    let deadline = setTimeout(function () {
      if (!finished) { child.kill('SIGKILL'); done(new Error('help blocked on open stdin')); }
    }, 3000);
    collect(child, function (code, out) {
      finished = true;
      clearTimeout(deadline);
      try {
        assert.equal(code, 0);
        assert.match(out, /output-file/);
        done();
      } catch (e) { done(e); }
    });
    // deliberately never write or end stdin
  });

  // A closed consumer pipe (e.g. `ejs ... | head`) must not dump a stack trace.
  test('closed stdout pipe does not produce a stack trace', function (done) {
    let big = 'x'.repeat(200000);
    let child = spawn(process.execPath, ['./bin/cli.js', '-m', '$', USER, 'name=' + big]);
    let err = '';
    child.stderr.on('data', function (d) { err += d; });
    child.stdout.on('data', function () { child.stdout.destroy(); }); // close early
    child.on('close', function () {
      try {
        assert.ok(!/\n\s+at\s/.test(err), 'stderr had a stack trace:\n' + err);
        done();
      } catch (e) { done(e); }
    });
  });

});
