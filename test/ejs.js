/* jshint mocha: true */

/**
 * Module dependencies.
 */

var ejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('assert')
  , path = require('path');

try {
  fs.mkdirSync(__dirname + '/tmp');
} catch (ex) {
  if (ex.code !== 'EEXIST') {
    throw ex;
  }
}

// From https://gist.github.com/pguillory/729616
function hook_stdout(callback) {
  var old_write = process.stdout.write;

  process.stdout.write = (function() {
    return function(string, encoding, fd) {
      callback(string, encoding, fd);
    };
  })(process.stdout.write);

  return function() {
    process.stdout.write = old_write;
  };
}

/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8').replace(/\r/g, '').trim();
}

/**
 * User fixtures.
 */

var users = [];
users.push({name: 'geddy'});
users.push({name: 'neil'});
users.push({name: 'alex'});

suite('ejs.compile(str, options)', function () {
  test('compile to a function', function () {
    var fn = ejs.compile('<p>yay</p>');
    assert.equal(fn(), '<p>yay</p>');
  });

  test('empty input works', function () {
    var fn = ejs.compile('');
    assert.equal(fn(), '');
  });

  test('throw if there are syntax errors', function () {
    try {
      ejs.compile(fixture('fail.ejs'));
    }
    catch (err) {
      assert.ok(err.message.indexOf('compiling ejs') > -1);

      try {
        ejs.compile(fixture('fail.ejs'), {filename: 'fail.ejs'});
      }
      catch (err) {
        assert.ok(err.message.indexOf('fail.ejs') > -1);
        return;
      }
    }
    throw new Error('no error reported when there should be');
  });

  test('allow customizing delimiter local var', function () {
    var fn;
    fn = ejs.compile('<p><?= name ?></p>', {delimiter: '?'});
    assert.equal(fn({name: 'geddy'}), '<p>geddy</p>');

    fn = ejs.compile('<p><:= name :></p>', {delimiter: ':'});
    assert.equal(fn({name: 'geddy'}), '<p>geddy</p>');

    fn = ejs.compile('<p><$= name $></p>', {delimiter: '$'});
    assert.equal(fn({name: 'geddy'}), '<p>geddy</p>');
  });

  test('default to using ejs.delimiter', function () {
    var fn;
    ejs.delimiter = '&';
    fn = ejs.compile('<p><&= name &></p>');
    assert.equal(fn({name: 'geddy'}), '<p>geddy</p>');

    fn = ejs.compile('<p><|= name |></p>', {delimiter: '|'});
    assert.equal(fn({name: 'geddy'}), '<p>geddy</p>');
    delete ejs.delimiter;
  });

  test('have a working client option', function () {
    var str = ejs.compile('<p><%= foo %></p>', {
      client: true
    , name: 'myTemp'
    });
    if (!process.env.running_under_istanbul) {
      /* global myTemp: false */
      eval(str);
      assert.equal(myTemp({foo: 'bar'}), '<p>bar</p>');
    }
  });

  test('support client mode without locals', function () {
    var preFn
      , str = ejs.compile('<p><%= "foo" %></p>', {client: true});
    if (!process.env.running_under_istanbul) {
      eval('preFn = ' + str);
      assert.equal(preFn(), '<p>foo</p>');
    }
  });
});

suite('ejs.render(str, data)', function () {
  test('render the template', function () {
    assert.equal(ejs.render('<p>yay</p>'), '<p>yay</p>');
  });

  test('empty input works', function () {
    assert.equal(ejs.render(''), '');
  });

  test('undefined renders nothing escaped', function () {
    assert.equal(ejs.render('<%= undefined %>'), '');
  });

  test('undefined renders nothing raw', function () {
    assert.equal(ejs.render('<%- undefined %>'), '');
  });

  test('null renders nothing escaped', function () {
    assert.equal(ejs.render('<%= null %>'), '');
  });

  test('null renders nothing raw', function () {
    assert.equal(ejs.render('<%- null %>'), '');
  });

  test('zero-value data item renders something escaped', function () {
    assert.equal(ejs.render('<%= 0 %>'), '0');
  });

  test('zero-value data object renders something raw', function () {
    assert.equal(ejs.render('<%- 0 %>'), '0');
  });

  test('accept locals', function () {
    assert.equal(ejs.render('<p><%= name %></p>', {name: 'geddy'}),
        '<p>geddy</p>');
  });

  test('accept locals without using with() {}', function () {
    assert.equal(ejs.render('<p><%= locals.name %></p>', {name: 'geddy'},
                            {_with: false}),
        '<p>geddy</p>');
    assert.throws(function() {
      ejs.render('<p><%= name %></p>', {name: 'geddy'},
                 {_with: false});
    }, /name is not defined/);
  });

  test('support caching (pass 1)', function () {
    var file = __dirname + '/tmp/render.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render('<p>Old</p>', {}, options)
      , expected = '<p>Old</p>';
    assert.equal(out, expected);
  });

  test('support caching (pass 2)', function () {
    var file = __dirname + '/tmp/render.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render('<p>New</p>', {}, options)
      , expected = '<p>Old</p>';
    assert.equal(out, expected);
  });
});

suite('ejs.renderFile(path, [data], [options], fn)', function () {
  test('render a file', function(done) {
    ejs.renderFile('test/fixtures/para.ejs', function(err, html) {
      if (err) {
        return done(err);
      }
      assert.equal(html, '<p>hey</p>');
      done();
    });
  });

  test('accept locals', function(done) {
    var data =  {name: 'fonebone'}
      , options = {delimiter: '$'};
    ejs.renderFile('test/fixtures/user.ejs', data, options, function(err, html) {
      if (err) {
        return done(err);
      }
      assert.equal(html, '<h1>fonebone</h1>');
      done();
    });
  });

  test('deprecation warning for data-in-opts', function(done) {
    var data =  {name: 'fonebone', delimiter: '$'}
      , warn = console.warn
      , incr = 0;

    console.warn = function (msg) {
      assert.ok(msg.indexOf('options found in locals object') > -1);
      incr++;
    };

    ejs.renderFile('test/fixtures/user.ejs', data, function(err, html) {
      if (err) {
        return done(err);
      }
      assert.equal(html, '<h1>fonebone</h1>');
      assert.equal(incr, 1);
      console.warn = warn;

      done();
    });
  });

  test('no deprecation warning for data-in-opts via Express', function(done) {
    var data =  {name: 'fonebone', delimiter: '$'}
      , warn = console.warn
      , incr = 0;

    console.warn = function () {
      incr++;
    };

    ejs.__express('test/fixtures/user.ejs', data, function(err, html) {
      if (err) {
        return done(err);
      }
      assert.equal(html, '<h1>fonebone</h1>');
      assert.equal(incr, 0);
      console.warn = warn;

      done();
    });
  });

  test('accept locals without using with() {}', function(done) {
    var data =  {name: 'fonebone'}
      , options = {delimiter: '$', _with: false}
      , doneCount = 0;
    ejs.renderFile('test/fixtures/user-no-with.ejs', data, options,
                   function(err, html) {
      if (err) {
        if (doneCount === 2) {
          return;
        }
        doneCount = 2;
        return done(err);
      }
      assert.equal(html, '<h1>fonebone</h1>');
      doneCount++;
      if (doneCount === 2) {
        done();
      }
    });
    ejs.renderFile('test/fixtures/user.ejs', data, options, function(err) {
      if (!err) {
        if (doneCount === 2) {
          return;
        }
        doneCount = 2;
        return done(new Error('error not thrown'));
      }
      doneCount++;
      if (doneCount === 2) {
        done();
      }
    });
  });

  test('not catch err thrown by callback', function(done) {
    var data =  {name: 'fonebone'}
      , options = {delimiter: '$'}
      , counter = 0;

    var d = require('domain').create();
    d.on('error', function (err) {
      assert.equal(counter, 1);
      assert.equal(err.message, 'Exception in callback');
      done();
    });
    d.run(function () {
      // process.nextTick() needed to work around mochajs/mocha#513
      //
      // tl;dr: mocha doesn't support synchronous exception throwing in
      // domains. Have to make it async. Ticket closed because: "domains are
      // deprecated :D"
      process.nextTick(function () {
        ejs.renderFile('test/fixtures/user.ejs', data, options,
                       function(err) {
          counter++;
          if (err) {
            assert.notEqual(err.message, 'Exception in callback');
            return done(err);
          }
          throw new Error('Exception in callback');
        });
      });
    });
  });

  test('support caching (pass 1)', function (done) {
    var expected = '<p>Old</p>'
      , file = __dirname + '/tmp/renderFile.ejs'
      , options = {cache: true};
    fs.writeFileSync(file, '<p>Old</p>');

    ejs.renderFile(file, {}, options, function (err, out) {
      if (err) {
        done(err);
      }
      assert.equal(out, expected);
      done();
    });
  });

  test('support caching (pass 2)', function (done) {
    var expected = '<p>Old</p>'
      , file = __dirname + '/tmp/renderFile.ejs'
      , options = {cache: true};
    fs.writeFileSync(file, '<p>New</p>');

    ejs.renderFile(file, {}, options, function (err, out) {
      if (err) {
        done(err);
      }
      assert.equal(out, expected);
      done();
    });
  });
});

suite('ejs.clearCache()', function () {
  test('work properly', function () {
    var expected = '<p>Old</p>'
      , file = __dirname + '/tmp/clearCache.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render('<p>Old</p>', {}, options);
    assert.equal(out, expected);

    ejs.clearCache();

    expected = '<p>New</p>';
    out = ejs.render('<p>New</p>', {}, options);
    assert.equal(out, expected);
  });
});

suite('<%=', function () {
  test('escape &amp;<script>', function () {
    assert.equal(ejs.render('<%= name %>', {name: '&nbsp;<script>'}),
        '&amp;nbsp;&lt;script&gt;');
  });

  test('should escape \'', function () {
    assert.equal(ejs.render('<%= name %>', {name: 'The Jones\'s'}),
      'The Jones&#39;s');
  });

  test('should escape &foo_bar;', function () {
    assert.equal(ejs.render('<%= name %>', {name: '&foo_bar;'}),
      '&amp;foo_bar;');
  });
});

suite('<%-', function () {
  test('not escape', function () {
    assert.equal(ejs.render('<%- name %>', {name: '<script>'}),
        '<script>');
  });

  test('terminate gracefully if no close tag is found', function () {
    try {
      ejs.compile('<h1>oops</h1><%- name ->');
      throw new Error('Expected parse failure');
    }
    catch (err) {
      assert.ok(err.message.indexOf('Could not find matching close tag for') > -1);
    }
  });
});

suite('%>', function () {
  test('produce newlines', function () {
    assert.equal(ejs.render(fixture('newlines.ejs'), {users: users}),
      fixture('newlines.html'));
  });
  test('consecutive tags work', function () {
    assert.equal(ejs.render(fixture('consecutive-tags.ejs')),
      fixture('consecutive-tags.html'));
  });
});

suite('-%>', function () {
  test('not produce newlines', function () {
    assert.equal(ejs.render(fixture('no.newlines.ejs'), {users: users}),
      fixture('no.newlines.html'));
  });
});

suite('<%%', function () {
  test('produce literals', function () {
    assert.equal(ejs.render('<%%- "foo" %>'),
      '<%- "foo" %>');
  });
  test('work without an end tag', function () {
    assert.equal(ejs.render('<%%'), '<%');
    assert.equal(ejs.render(fixture('literal.ejs'), {}, {delimiter: ' '}),
      fixture('literal.html'));
  });
});

suite('single quotes', function () {
  test('not mess up the constructed function', function () {
    assert.equal(ejs.render(fixture('single-quote.ejs')),
      fixture('single-quote.html'));
  });
});

suite('double quotes', function () {
  test('not mess up the constructed function', function () {
    assert.equal(ejs.render(fixture('double-quote.ejs')),
      fixture('double-quote.html'));
  });
});

suite('backslashes', function () {
  test('escape', function () {
    assert.equal(ejs.render(fixture('backslash.ejs')),
      fixture('backslash.html'));
  });
});

suite('messed up whitespace', function () {
  test('work', function () {
    assert.equal(ejs.render(fixture('messed.ejs'), {users: users}),
      fixture('messed.html'));
  });
});

suite('exceptions', function () {
  test('produce useful stack traces', function () {
    try {
      ejs.render(fixture('error.ejs'), {}, {filename: 'error.ejs'});
    }
    catch (err) {
      assert.equal(err.path, 'error.ejs');
      assert.equal(err.stack.split('\n').slice(0, 8).join('\n'), fixture('error.out'));
      return;
    }
    throw new Error('no error reported when there should be');
  });

  test('not include fancy stack info if compileDebug is false', function () {
    try {
      ejs.render(fixture('error.ejs'), {}, {
        filename: 'error.ejs',
        compileDebug: false
      });
    }
    catch (err) {
      assert.ok(!err.path);
      assert.notEqual(err.stack.split('\n').slice(0, 8).join('\n'), fixture('error.out'));
      return;
    }
    throw new Error('no error reported when there should be');
  });

  var unhook = null;
  test('log JS source when debug is set', function (done) {
    var out = ''
      , needToExit = false;
    unhook = hook_stdout(function (str) {
      out += str;
      if (needToExit) {
        return;
      }
      if (out.indexOf('__output')) {
        needToExit = true;
        unhook();
        unhook = null;
        return done();
      }
    });
    ejs.render(fixture('hello-world.ejs'), {}, {debug: true});
  });
  teardown(function() {
    if (!unhook) {
      return;
    }
    unhook();
    unhook = null;
  });
});

suite('include()', function () {
  test('include ejs', function () {
    var file = 'test/fixtures/include-simple.ejs';
    assert.equal(ejs.render(fixture('include-simple.ejs'), {}, {filename: file}),
        fixture('include-simple.html'));
  });

  test('include ejs fails without `filename`', function () {
    try {
      ejs.render(fixture('include-simple.ejs'));
    }
    catch (err) {
      assert.ok(err.message.indexOf('requires the \'filename\' option') > -1);
      return;
    }
    throw new Error('expected inclusion error');
  });

  test('include ejs with locals', function () {
    var file = 'test/fixtures/include.ejs';
    assert.equal(ejs.render(fixture('include.ejs'), {pets: users}, {filename: file, delimiter: '@'}),
        fixture('include.html'));
  });

  test('include ejs with absolute path and locals', function () {
    var file = 'test/fixtures/include-abspath.ejs';
    assert.equal(ejs.render(fixture('include-abspath.ejs'),
      {dir: path.join(__dirname, 'fixtures'), pets: users, path: path},
      {filename: file, delimiter: '@'}),
        fixture('include.html'));
  });

  test('work when nested', function () {
    var file = 'test/fixtures/menu.ejs';
    assert.equal(ejs.render(fixture('menu.ejs'), {pets: users}, {filename: file}),
        fixture('menu.html'));
  });

  test('work with a variable path', function () {
    var file = 'test/fixtures/menu_var.ejs',
        includePath = 'includes/menu-item';
    assert.equal(ejs.render(fixture('menu.ejs'), {pets: users, varPath:  includePath}, {filename: file}),
      fixture('menu.html'));
  });

  test('include arbitrary files as-is', function () {
    var file = 'test/fixtures/include.css.ejs';
    assert.equal(ejs.render(fixture('include.css.ejs'), {pets: users}, {filename: file}),
        fixture('include.css.html'));
  });

  test('pass compileDebug to include', function () {
    var file = 'test/fixtures/include.ejs'
      , fn;
    fn = ejs.compile(fixture('include.ejs'), {
      filename: file
    , delimiter: '@'
    , compileDebug: false
    });
    try {
      // Render without a required variable reference
      fn({foo: 'asdf'});
    }
    catch(e) {
      assert.equal(e.message, 'pets is not defined');
      assert.ok(!e.path);
      return;
    }
    throw new Error('no error reported when there should be');
  });

  test('is dynamic', function () {
    fs.writeFileSync(__dirname + '/tmp/include.ejs', '<p>Old</p>');
    var file = 'test/fixtures/include_cache.ejs'
      , options = {filename: file}
      , out = ejs.compile(fixture('include_cache.ejs'), options);
    assert.equal(out(), '<p>Old</p>');

    fs.writeFileSync(__dirname + '/tmp/include.ejs', '<p>New</p>');
    assert.equal(out(), '<p>New</p>');
  });

  test('support caching (pass 1)', function () {
    fs.writeFileSync(__dirname + '/tmp/include.ejs', '<p>Old</p>');
    var file = 'test/fixtures/include_cache.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render(fixture('include_cache.ejs'), {}, options)
      , expected = fixture('include_cache.html');
    assert.equal(out, expected);
  });

  test('support caching (pass 2)', function () {
    fs.writeFileSync(__dirname + '/tmp/include.ejs', '<p>New</p>');
    var file = 'test/fixtures/include_cache.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render(fixture('include_cache.ejs'), {}, options)
      , expected = fixture('include_cache.html');
    assert.equal(out, expected);
  });
});

suite('preprocessor include', function () {
  test('work', function () {
    var file = 'test/fixtures/include_preprocessor.ejs';
    assert.equal(ejs.render(fixture('include_preprocessor.ejs'), {pets: users}, {filename: file, delimiter: '@'}),
        fixture('include_preprocessor.html'));
  });

  test('fails without `filename`', function () {
    try {
      ejs.render(fixture('include_preprocessor.ejs'), {pets: users}, {delimiter: '@'});
    }
    catch (err) {
      assert.ok(err.message.indexOf('requires the \'filename\' option') > -1);
      return;
    }
    throw new Error('expected inclusion error');
  });

  test('work when nested', function () {
    var file = 'test/fixtures/menu_preprocessor.ejs';
    assert.equal(ejs.render(fixture('menu_preprocessor.ejs'), {pets: users}, {filename: file}),
        fixture('menu_preprocessor.html'));
  });

  test('include arbitrary files as-is', function () {
    var file = 'test/fixtures/include_preprocessor.css.ejs';
    assert.equal(ejs.render(fixture('include_preprocessor.css.ejs'), {pets: users}, {filename: file}),
        fixture('include_preprocessor.css.html'));
  });

  test('pass compileDebug to include', function () {
    var file = 'test/fixtures/include_preprocessor.ejs'
      , fn;
    fn = ejs.compile(fixture('include_preprocessor.ejs'), {
      filename: file
    , delimiter: '@'
    , compileDebug: false
    });
    try {
      // Render without a required variable reference
      fn({foo: 'asdf'});
    }
    catch(e) {
      assert.equal(e.message, 'pets is not defined');
      assert.ok(!e.path);
      return;
    }
    throw new Error('no error reported when there should be');
  });

  test('is static', function () {
    fs.writeFileSync(__dirname + '/tmp/include_preprocessor.ejs', '<p>Old</p>');
    var file = 'test/fixtures/include_preprocessor_cache.ejs'
      , options = {filename: file}
      , out = ejs.compile(fixture('include_preprocessor_cache.ejs'), options);
    assert.equal(out(), '<p>Old</p>');

    fs.writeFileSync(__dirname + '/tmp/include_preprocessor.ejs', '<p>New</p>');
    assert.equal(out(), '<p>Old</p>');
  });

  test('support caching (pass 1)', function () {
    fs.writeFileSync(__dirname + '/tmp/include_preprocessor.ejs', '<p>Old</p>');
    var file = 'test/fixtures/include_preprocessor_cache.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render(fixture('include_preprocessor_cache.ejs'), {}, options)
      , expected = fixture('include_preprocessor_cache.html');
    assert.equal(out, expected);
  });

  test('support caching (pass 2)', function () {
    fs.writeFileSync(__dirname + '/tmp/include_preprocessor.ejs', '<p>New</p>');
    var file = 'test/fixtures/include_preprocessor_cache.ejs'
      , options = {cache: true, filename: file}
      , out = ejs.render(fixture('include_preprocessor_cache.ejs'), {}, options)
      , expected = fixture('include_preprocessor_cache.html');
    assert.equal(out, expected);
  });
});

suite('comments', function () {
  test('fully render with comments removed', function () {
    assert.equal(ejs.render(fixture('comments.ejs')),
        fixture('comments.html'));
  });
});

suite('require', function () {

  // Only works with inline/preprocessor includes
  test('allow ejs templates to be required as node modules', function () {
      var file = 'test/fixtures/include_preprocessor.ejs'
        , template = require(__dirname + '/fixtures/menu_preprocessor.ejs');
      if (!process.env.running_under_istanbul) {
        assert.equal(template({filename: file, pets: users}),
          fixture('menu_preprocessor.html'));
      }
  });
});

