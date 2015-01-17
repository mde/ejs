#!/usr/bin/env node
/*!
 * EJS CLI
 * Copyright 2010 TJ Holowaychuk (tj@vision-media.ca)
 * Copyright 2015 Tiancheng "Timothy" Gu (timothygu99@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Ported from Jade. Originally licensed under the MIT License.
 */

var fs = require('fs')
  , program = require('commander')
  , path = require('path')
  , basename = path.basename
  , dirname = path.dirname
  , resolve = path.resolve
  , join = path.join
  , mkdirp = require('mkdirp')
  , ejs = require('../')
  , options = {}
  , locals = {};

program
  .version(require('../package.json').version)
  .usage('[options] [dir|file ...]')
  .option('-O, --opts <str|path>', 'options from JavaScript object string or JSON file')
  .option('-l, --locals <str|path>', 'locals from JavaScript object string or JSON file')
  .option('-o, --out <dir>', 'output the compiled html to <dir>')
  .option('-p, --path <path>', 'filename used to resolve includes')
  .option('-d, --delimiter <char>', 'delimiter to use for denoting JS code')
  .option('-c, --client', 'compile function for client-side runtime')
  .option('-D, --no-debug', 'compile without debugging (smaller functions)')
  .option('-w, --watch', 'watch files for changes and automatically re-render')
  .option('-E, --extension <ext>', 'specify the output file extension');

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    # renders all EJS files in the `templates` directory');
  console.log('    $ ejs templates');
  console.log('');
  console.log('    # create {foo,bar}.html');
  console.log('    $ ejs {foo,bar}.ejs');
  console.log('');
  console.log('    # read my.ejs and output to my.html through stdio');
  console.log('    $ ejs < my.ejs > my.html');
  console.log('');
  console.log('    # reads EJS string from stdin and output to stdout');
  console.log('    $ echo \'<%= "hello ejs" %>\' | ejs');
  console.log('');
  console.log('    # foo, bar dirs rendering to /tmp');
  console.log('    $ ejs foo bar --out /tmp ');
  console.log('');
});

program.parse(process.argv);

// --opts

if (program.opts) {
  if (fs.existsSync(program.opts)) {
    options = JSON.parse(fs.readFileSync(program.opts));
  }
  else {
    options = eval('(' + program.opts + ')');
  }
}

// --locals

if (program.locals) {
  if (fs.existsSync(program.locals)) {
    locals = JSON.parse(fs.readFileSync(program.locals));
  }
  else {
    locals = eval('(' + program.locals + ')');
  }
}

// --path

if (program.path) {
  options.filename = program.path;
}

// --delimiter

if (program.delimiter) {
  options.delimiter = program.delimiter;
}

// --no-debug

options.compileDebug = program.debug;

// --client

options.client = program.client;

// --watch

options.watch = program.watch;

// left-over args are file paths

var files = program.args;

// compile files

if (files.length) {
  console.log();
  if (options.watch) {
    files.forEach(function(filename) {
      try {
        renderFile(filename);
      }
      catch (e) {
        // keep watching when error occured.
        console.error(e.stack || e.message || e);
      }
      fs.watchFile(filename, {persistent: true, interval: 200},
                   function (curr, prev) {
        if (curr.mtime.getTime() === prev.mtime.getTime()) {
          return;
        }
        try {
          renderFile(filename);
        }
        catch (e) {
          // keep watching when error occured.
          console.error(e.stack || e.message || e);
        }
      });
    });
    process.on('SIGINT', function() {
      process.exit(1);
    });
  }
  else {
    files.forEach(renderFile);
  }
  process.on('exit', function () {
    console.log();
  });
}
// stdio
else {
  stdin();
}

/**
 * Compile from stdin.
 */

function stdin() {
  var buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) {
    buf += chunk;
  });
  process.stdin.on('end', function() {
    var output;
    if (options.client) {
      output = ejs.compile(buf, options);
    }
    else {
      output = ejs.compile(buf, options)(locals);
    }
    process.stdout.write(output + '\n');
  }).resume();
}

/**
 * Process the given path, compiling the ejs files found.
 * Always walk the subdirectories.
 */

function renderFile(path) {
  var re = /\.ejs$/;
  var stat = fs.lstatSync(path);
  // Found ejs file/\.ejs$/
  if (stat.isFile() && re.test(path)) {
    var str = fs.readFileSync(path, 'utf8');
    if (!options.filename) {
      options.filename = path;
    }
    var fn = ejs.compile(str, options);

    // --extension
    var extname;
    if (program.extension) {
      extname = '.' + program.extension;
    }
    else if (options.client) {
      extname = '.js';
    }
    else {
      extname = '.html';
    }

    path = path.replace(re, extname);
    if (program.out) {
      path = join(program.out, basename(path));
    }
    var dir = resolve(dirname(path));
    mkdirp.sync(dir, 0755);
    var output = options.client ? fn.toString() : fn(locals);
    fs.writeFileSync(path, output);
    console.log('  \033[90mrendered \033[36m%s\033[0m', path);
  // Found directory
  }
  else if (stat.isDirectory()) {
    var files = fs.readdirSync(path);
    files.map(function(filename) {
      return join(path, filename);
    }).forEach(renderFile);
  }
}
