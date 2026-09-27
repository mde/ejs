#!/usr/bin/env node
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
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
*/

'use strict';

let path = require('path');
let fs = require('fs');
let { Parser } = require('../lib/cjs/parseargs');
let ejs = require('../lib/cjs/ejs');

let hasOwn = function (obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); };

// If the consumer closes our output pipe (e.g. `ejs ... | head`), writing gets
// EPIPE. Exit quietly rather than dumping an uncaught stack trace.
function handlePipeError(stream) {
  stream.on('error', function (err) {
    if (err && err.code === 'EPIPE') { process.exit(0); }
    throw err;
  });
}
handlePipeError(process.stdout);
handlePipeError(process.stderr);

// Exit codes: 2 = usage error, 1 = runtime failure, 0 = success.
let EXIT_USAGE = 2;
let EXIT_RUNTIME = 1;

let CLI_OPTS = [
  { full: 'output-file',    abbr: 'o', expectValue: true },
  { full: 'data-file',      abbr: 'f', expectValue: true },
  { full: 'data-input',     abbr: 'i', expectValue: true },
  { full: 'delimiter',      abbr: 'm', expectValue: true },
  { full: 'open-delimiter', abbr: 'p', expectValue: true },
  { full: 'close-delimiter', abbr: 'c', expectValue: true },
  { full: 'locals-name',    abbr: 'l', expectValue: true },
  { full: 'strict',         abbr: 's' },
  { full: 'no-with',        abbr: 'n' },
  { full: 'rm-whitespace',  abbr: 'w' },
  { full: 'debug',          abbr: 'd' },
  { full: 'help',           abbr: 'h' },
  { full: 'version',        abbr: 'V' },
  { full: 'version',        abbr: 'v' },
];

let usage = function () {
  return fs.readFileSync(path.join(__dirname, '../usage.txt')).toString();
};

let errorMessage = function (e) {
  switch (e.code) {
  case 'unknown-option':
    return "unrecognized option '" + e.arg + "'";
  case 'missing-value':
    return "option '" + e.arg + "' requires a value";
  case 'unexpected-value':
    return "option '" + e.arg + "' does not take a value";
  default:
    return 'bad argument: ' + e.arg;
  }
};

let usageError = function (msg) {
  process.stderr.write('ejs: ' + msg + '\n');
  process.stderr.write("Try 'ejs -h' for more information.\n");
  process.exitCode = EXIT_USAGE;
};

let runtimeError = function (msg) {
  process.stderr.write('ejs: ' + msg + '\n');
  process.exitCode = EXIT_RUNTIME;
};

// Build the ejs render options from parsed CLI options.
let renderOpts = function (opts, template) {
  let o = { filename: path.resolve(process.cwd(), template) };
  if (hasOwn(opts, 'delimiter')) { o.delimiter = opts['delimiter']; }
  if (hasOwn(opts, 'open-delimiter')) { o.openDelimiter = opts['open-delimiter']; }
  if (hasOwn(opts, 'close-delimiter')) { o.closeDelimiter = opts['close-delimiter']; }
  if (hasOwn(opts, 'locals-name')) { o.localsName = opts['locals-name']; }
  if (opts['strict']) { o.strict = true; }
  if (opts['rm-whitespace']) { o.rmWhitespace = true; }
  if (opts['debug']) { o.debug = true; }
  // --strict implies not using `with`, matching the historical CLI behavior.
  if (opts['strict'] || opts['no-with']) { o._with = false; }
  return o;
};

// Classify the operands after the template into name=value data. Returns a
// null-prototype object, or throws for an operand that is not a data pair.
let classifyData = function (operands) {
  let data = Object.create(null);
  for (let k = 0; k < operands.length; k++) {
    let o = operands[k];
    let eq = o.indexOf('=');
    if (eq === -1) {
      throw new Error("unexpected argument '" + o + "' (data must be name=value)");
    }
    data[o.slice(0, eq)] = o.slice(eq + 1);
  }
  return data;
};

// Merge without triggering prototype-pollution via setters.
let safeAssign = function (target, key, value) {
  Object.defineProperty(target, key, {
    value: value, writable: true, enumerable: true, configurable: true
  });
};

// Read all of stdin, unless it is a TTY (interactive) — then there is nothing
// piped in. Async so a slow/chunked pipe is fully collected before we resolve
// data. Help/version/usage errors are dispatched before this is ever called.
let readStdin = function (cb) {
  if (process.stdin.isTTY) {
    cb(null, '');
    return;
  }
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (d) { data += d; });
  process.stdin.on('end', function () { cb(null, data); });
  process.stdin.on('error', function (err) { cb(err); });
  process.stdin.resume();
};

function main() {
  let parsed = new Parser(CLI_OPTS).parse(process.argv.slice(2));
  let opts = parsed.opts;

  // Precedence: help/version win over everything, including parse errors.
  if (opts['help']) {
    process.stdout.write(usage());
    return;
  }
  if (opts['version']) {
    process.stdout.write(ejs.VERSION + '\n');
    return;
  }
  if (parsed.errors.length) {
    parsed.errors.forEach(function (e) {
      process.stderr.write('ejs: ' + errorMessage(e) + '\n');
    });
    process.stderr.write("Try 'ejs -h' for more information.\n");
    process.exitCode = EXIT_USAGE;
    return;
  }

  // The template is always the first operand; the rest are name=value data.
  let template = parsed.operands[0];
  if (template === undefined) {
    usageError('please provide a template path');
    return;
  }

  let dataArgs = parsed.operands.slice(1);
  let bare = dataArgs.filter(function (o) { return o.indexOf('=') === -1; });
  if (bare.length) {
    // A bare (no '=') operand after the template is not data. If the template
    // itself looks like name=value, the args are almost certainly reversed.
    if (template.indexOf('=') !== -1) {
      usageError("the template path must come first, before data values (got '" +
        template + "')");
    }
    else {
      usageError("unexpected argument '" + bare[0] + "' (data must be name=value)");
    }
    return;
  }
  let positional = classifyData(dataArgs);

  // -i and -f are the two explicit JSON sources; passing both is a conflict.
  let hasInput = hasOwn(opts, 'data-input');
  let hasFile = hasOwn(opts, 'data-file');
  if (hasInput && hasFile) {
    usageError('please pass data only one way: stdin, -i, or -f');
    return;
  }

  // stdin is the fallback JSON base: read it ONLY when no other data was given
  // (no -i, no -f, no name=value). This matches `cat data.json | ejs tpl.ejs`,
  // and — crucially — means we never block on stdin when data came another way.
  let needStdin = !hasInput && !hasFile && Object.keys(positional).length === 0;
  if (!needStdin) {
    finish(opts, template, positional, '');
    return;
  }
  readStdin(function (streamErr, stdinStr) {
    if (streamErr) {
      runtimeError('could not read stdin: ' + streamErr.message);
      return;
    }
    finish(opts, template, positional, stdinStr);
  });
}

function finish(opts, template, positional, stdinStr) {
  // Exactly one JSON base source can be present here (main() gates the rest):
  // stdin only when nothing else was given, and -i/-f are mutually exclusive.
  let hasStdin = stdinStr.length > 0;
  let hasInput = hasOwn(opts, 'data-input');
  let hasFile = hasOwn(opts, 'data-file');

  let raw;
  try {
    if (hasStdin) { raw = stdinStr; }
    else if (hasInput) { raw = decodeURIComponent(opts['data-input']); }
    else if (hasFile) { raw = fs.readFileSync(opts['data-file'], 'utf8'); }
  }
  catch (err) {
    runtimeError(err.message);
    return;
  }

  let vals = Object.create(null);
  if (raw !== undefined && raw !== '') {
    let parsedData;
    try {
      parsedData = JSON.parse(raw);
    }
    catch (err) {
      runtimeError('could not parse data as JSON: ' + err.message);
      return;
    }
    // Ignore JSON null / primitives — there are no locals to spread from them.
    if (parsedData !== null && typeof parsedData === 'object') {
      Object.keys(parsedData).forEach(function (k) {
        safeAssign(vals, k, parsedData[k]);
      });
    }
  }

  // name=value operands override data-source values.
  Object.keys(positional).forEach(function (k) {
    safeAssign(vals, k, positional[k]);
  });

  let output;
  try {
    let tpl = fs.readFileSync(path.resolve(process.cwd(), template), 'utf8');
    output = ejs.render(tpl, vals, renderOpts(opts, template));
  }
  catch (err) {
    runtimeError(err.message);
    return;
  }

  if (hasOwn(opts, 'output-file')) {
    try {
      fs.writeFileSync(opts['output-file'], output);
    }
    catch (err) {
      runtimeError(err.message);
      return;
    }
  }
  else {
    process.stdout.write(output);
  }
  // Success: leave process.exitCode at its default (0) and let the process exit
  // naturally so stdout flushes fully (process.exit() can truncate a pipe).
}

main();
