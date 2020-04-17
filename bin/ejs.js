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
  , normalize = path.normalize
  , join = path.join
  , mkdirp = require('mkdirp')
  , ejs = require('../')
  , options = {}
  , locals = {};

program
  .version(require('../package.json').version)
  .usage('[options] [dir|file ...]')
  .option('-O, --obj <str|path>', 'JavaScript options object or JSON file containing it')
  .option('-l, --locals <str|path>', 'JavaScript locals object or JSON file containing it')
  .option('-o, --out <dir>', 'output the compiled html to <dir>')
  .option('-p, --path <path>', 'filename used to resolve includes')
  .option('-d, --delimiter <char>', 'delimiter to use for denoting JS code')
  .option('-c, --client', 'compile function for client-side')
//.option('-n, --name <str>', 'The name of the compiled template (requires --client)')
  .option('-D, --no-debug', 'compile without debugging (smaller functions)')
  .option('-w, --watch', 'watch files for changes and automatically re-render')
  .option('-E, --extension <ext>', 'specify the output file extension');
//.option('--name-after-file', 'Name the template after the last section of the file path (requires --client and overriden by --name)');

program.on('--help', function (){
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

// --obj

if (program.obj) {
  options = parseObj(program.obj);
}

// --locals

if (program.locals) {
  locals = parseObj(program.locals);
}

/**
 * Parse object either in `input` or in the file called `input`. The latter is
 * searched first.
 */
function parseObj (input) {
  var str, out;
  try {
    str = fs.readFileSync(program.obj);
  } catch (e) {
    return eval('(' + program.obj + ')');
  }
  // We don't want to catch exceptions thrown in JSON.parse() so have to
  // use this two-step approach.
  return JSON.parse(str);
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

// --name

if (typeof program.name === 'string') {
  options.name = program.name;
}

// left-over args are file paths

var files = program.args;

// array of paths that are being watched

var watchList = [];

// compile files

if (files.length) {
  console.log();
  if (options.watch) {
    process.on('SIGINT', function () {
      process.exit(1);
    });
    files.forEach(function (f) {
      return tryRender(f);
    });
  } else {
    files.forEach(function (f) {
      return renderFile(f);
    });
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
 * Watch for changes on path
 *
 * Renders `base` if specified, otherwise renders `path`.
 *
 * `base` is unused right now but will be used when dependency tracking is
 * enabled.
 */
function watchFile(path, base) {
  path = normalize(path);
  if (watchList.indexOf(path) !== -1) return;
  console.log("  \033[90mwatching \033[36m%s\033[0m", path);
  fs.watchFile(path, {persistent: true, interval: 200},
               function (curr, prev) {
    // File doesn't exist anymore. Keep watching.
    if (curr.mtime.getTime() === 0) {
      return;
    }
    // istanbul ignore if
    if (curr.mtime.getTime() === prev.mtime.getTime()) {
      return;
    }
    tryRender(base || path);
  });
  watchList.push(path);
}

/**
 * Convert error to string
 */
function errorToString(e) {
  return e.stack || /* istanbul ignore next */ (e.message || e);
}

/**
 * Try to render `path`; if an exception is thrown it is printed to stderr and
 * otherwise ignored.
 *
 * This is used in watch mode.
 */
function tryRender(path, rootPath) {
  try {
    renderFile(path, rootPath, tryRender);
  } catch (e) {
    // keep watching when error occured.
    console.error(errorToString(e));
  }
}

/**
 * Compile from stdin.
 */

function stdin() {
  var buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (chunk) {
    buf += chunk;
  });
  process.stdin.on('end', function () {
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

function renderFile(path, rootPath, cb) {
  var re = /\.ejs$/;
  var stat = fs.lstatSync(path);
  cb = cb || renderFile;
  // Found ejs file/\.ejs$/
  if (stat.isFile() && re.test(path)) {
    if (options.watch) {
      watchFile(path);
    }
    var str = fs.readFileSync(path, 'utf8');
    if (!options.filename) {
      options.filename = path;
    }
    if (program.nameAfterFile) {
      options.name = getNameFromFileName(path);
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
      if (rootPath) {
        path = join(program.out, path.replace(rootPath, ''));
      } else {
        path = join(program.out, basename(path));
      }
    }
    var dir = resolve(dirname(path));
    mkdirp.sync(dir, 0755);
    var output = options.client ? fn.toString() : fn(locals);
    fs.writeFileSync(path, output);
    console.log('  \033[90mrendered \033[36m%s\033[0m', normalize(path));
  // Found directory
  }
  else if (stat.isDirectory()) {
    var files = fs.readdirSync(path);
    files.map(function (filename) {
      return join(path, filename);
    }).forEach(function (file) {
      cb(file, rootPath || path);
    });
  }
}

/**
 * Get a sensible name for a template function from a file path
 *
 * Unused right now. Will be used in EJS v3 with proper client function
 * generation support.
 *
 * @param {String} filename
 * @returns {String}
 */
function getNameFromFileName(filename) {
  var file = basename(filename, '.ejs');
  return file.toLowerCase().replace(/[^a-z0-9]+([a-z])/g, function (_, character) {
    return character.toUpperCase();
  }) + 'Template';
}
