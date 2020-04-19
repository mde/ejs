let exec = require('child_process').execSync;
let assert = require('assert');

function run(cmd) {
  return exec(cmd).toString();
}

suite('cli', function () {
  test('rendering, custom delimiter, passed data', function () {
    let o = run('./bin/cli.js -m $ ./test/fixtures/user.ejs name=foo');
    assert.equal(o, '<h1>foo</h1>\n');
  });

  test('rendering, custom delimiter, data from file', function () {
    let o = run('./bin/cli.js -m $ -f ./test/fixtures/user_data.json ./test/fixtures/user.ejs');
    assert.equal(o, '<h1>zerb</h1>\n');
  });

  test('rendering, custom delimiter, passed data overrides file', function () {
    let o = run('./bin/cli.js -m $ -f ./test/fixtures/user_data.json ./test/fixtures/user.ejs name=frang');
    assert.equal(o, '<h1>frang</h1>\n');
  });

});


