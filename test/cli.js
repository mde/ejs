let exec = require('child_process').execSync;
let fs = require('fs');
let assert = require('assert');

function run(cmd) {
  return exec(cmd).toString();
}

suite('cli', function () {
  test('rendering, custom delimiter, passed data', function () {
    let o = run('./bin/cli.js -m $ ./test/fixtures/user.ejs name=foo');
    assert.equal(o, '<h1>foo</h1>\n');
  });

  test('rendering, custom delimiter, data from file with -f', function () {
    let o = run('./bin/cli.js -m $ -f ./test/fixtures/user_data.json ./test/fixtures/user.ejs');
    assert.equal(o, '<h1>zerb</h1>\n');
  });

  test('rendering, custom delimiter, data from CLI arg with -i', function () {
    let o = run('./bin/cli.js -m $ -i %7B%22name%22%3A%20%22foo%22%7D ./test/fixtures/user.ejs');
    assert.equal(o, '<h1>foo</h1>\n');
  });

  test('rendering, custom delimiter, data from stdin / pipe', function () {
    let o = run('cat ./test/fixtures/user_data.json | ./bin/cli.js -m $ ./test/fixtures/user.ejs');
    assert.equal(o, '<h1>zerb</h1>\n');
  });

  test('rendering, custom delimiter, passed data overrides file', function () {
    let o = run('./bin/cli.js -m $ -f ./test/fixtures/user_data.json ./test/fixtures/user.ejs name=frang');
    assert.equal(o, '<h1>frang</h1>\n');
  });

  test('rendering, remove whitespace option (hyphen case)', function () {
    let o = run('./bin/cli.js --rm-whitespace ./test/fixtures/rmWhitespace.ejs');
    assert.equal(o, fs.readFileSync('test/fixtures/rmWhitespace.html', 'utf-8'));
  });

});


