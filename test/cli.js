import { execSync as exec } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { equal } from 'assert';
let os = process.platform !== 'win32' ? '' : 'node ';
let lf = process.platform !== 'win32' ? '\n' : '\r\n';

function run(cmd) {
  return exec(cmd).toString();
}

suite('cli', function () {
  test('rendering, custom delimiter, passed data', function () {
    let x = join('./bin/cli.js');
    let u = join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ '+u+' name=foo');
    equal(o, '<h1>foo</h1>'+lf);
  });

  test('rendering, custom delimiter, data from file with -f', function () {
    let x = join('./bin/cli.js');
    let u = join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -f ./test/fixtures/user_data.json '+u);
    equal(o, '<h1>zerb</h1>'+lf);
  });

  test('rendering, custom delimiter, data from CLI arg with -i', function () {
    let x = join('./bin/cli.js');
    let u = join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -i %7B%22name%22%3A%20%22foo%22%7D '+u);
    equal(o, '<h1>foo</h1>'+lf);
  });

  test('rendering, custom delimiter, data from stdin / pipe', function () {
    if ( process.platform !== 'win32' ) {
      let o = run('cat ./test/fixtures/user_data.json | ./bin/cli.js -m $ ./test/fixtures/user.ejs');
      equal(o, '<h1>zerb</h1>\n');
    } // does not work on windows...
  });

  test('rendering, custom delimiter, passed data overrides file', function () {
    let x = join('./bin/cli.js');
    let f = join('./test/fixtures/user_data.json');
    let g = join('./test/fixtures/user.ejs');
    let o = run(os+x+' -m $ -f '+f+' '+g+' name=frang');
    equal(o, '<h1>frang</h1>'+lf);
  });

  test('rendering, remove whitespace option (hyphen case)', function () {
    let x = join('./bin/cli.js');
    let f = join('./test/fixtures/rmWhitespace.ejs');
    let o = run(os+x+' --rm-whitespace '+f);
    let c = readFileSync('test/fixtures/rmWhitespace.html', 'utf-8');
    equal(o.replace(/\n/g, lf), c);
  });

  test('relative path in nested include', function () {
    let x = join('./bin/cli.js');
    let u = join('test/fixtures/include-simple.ejs');
    let o = run(os+x+' '+u);
    let c = readFileSync('test/fixtures/include-simple.html', 'utf-8');
    equal(o, c);
  });

});
