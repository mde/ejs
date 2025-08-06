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
let parseArgs = require('minimist');
let fs = require('fs');
let path = require('path');
let ejs = require('../lib/ejs');

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    stdin += chunk;
  }
});

function printUsage() {
  const usagePath = path.join(__dirname, '../usage.txt');
  let usageText = fs.readFileSync(usagePath).toString();
  console.log(usageText);
}

function printVersion() {
  console.log(ejs.VERSION);
}


function run() {
  let args = process.argv.slice(2);
  let argv = parseArgs(args, {
    alias: {
      'o': 'output-file',
      'f': 'data-file',
      'i': 'data-input',
      'm': 'delimiter',
      'p': 'open-delimiter',
      'c': 'close-delimiter',
      's': 'strict',
      'n': 'no-with',
      'l': 'locals-name',
      'w': 'rm-whitespace',
      'd': 'debug',
      'h': 'help',
      'V': 'version',
      'v': 'version',
    },
    boolean: [
      'help',
      'version',
      'debug',
      'rm-whitespace',
      'strict',
      'no-with'
    ],
    string: [
      'output-file',
      'data-file',
      'data-input',
      'delimiter',
      'open-delimiter',
      'close-delimiter',
      'locals-name'
    ],
    default: {
      'delimiter': '%',
      'close-delimiter': '>',
      'open-delimiter': '<',
    }
  });


  if (argv.help) {
    printUsage();
    process.exit(0);
  }
  if (argv.version) {
    printVersion();
    process.exit(0);
  }

  // Parse out any environment variables passed after the template path
  // Based on jake parseArgs envVars implementation to ensure non-breaking changes in jake migration
  // @see https://github.com/jakejs/jake/blob/main/lib/parseargs.js#L111
  let envVars = {};
  let templatePaths = [];
  argv._.map(v => v.split('=')).forEach(pair => {
    if (pair.length > 1) {
      envVars[pair[0]] = pair[1];
    } else {
      templatePaths.push(pair[0]);
    }
  });

  // Template path is always is first positional argument without "="
  // Template path is required and we will throw an error if it is not provided
  let templatePath = templatePaths[0];
  if (!templatePath) {
    throw new Error('Please provide a template path. (Run ejs -h for help)');
  }

  // Grab and parse any input data, in order of precedence:
  // 1. Stdin
  // 2. CLI arg via -i
  // 3. Data file via -f
  // Any individual vals passed at the end (e.g., foo=bar) will override
  // any vals previously set
  let input;
  let err = new Error('Please do not pass data multiple ways. Pick one of stdin, -f, or -i.');
  if (stdin) {
    input = stdin;
  }
  else if (argv['data-input']) {
    if(Array.isArray(argv['data-input'])) {
      throw new Error('Please provide a single string for data input. (Run ejs -h for help)');
    }
    if (input) {
      throw err;
    }
    input = decodeURIComponent(argv['data-input']);
  }
  else if (argv['data-file']) {
    if (Array.isArray(argv['data-file'])) {
      throw new Error('Please provide a single string for data file. (Run ejs -h for help)');
    }
    if (input) {
      throw err;
    }
    input = fs.readFileSync(argv['data-file']).toString();
  }
  let vals = {};
  if (input) {
    vals = JSON.parse(input);
  }
  // Override set any individual values passed from the command line
  for (let p in envVars) {
    vals[p] = envVars[p];
  }

  // strict implies no-with
  if (argv['strict']) {
    argv['no-with'] = true;
  }

  let opts = {
    filename: path.resolve(process.cwd(), templatePath),
    rmWhitespace: argv['rm-whitespace'],
    strict: argv['strict'],
    debug: argv['debug'],
    localsName: argv['locals-name'],
    delimiter: argv['delimiter'],
    openDelimiter: argv['open-delimiter'],
    closeDelimiter: argv['close-delimiter'],
    _with: !argv['no-with'],
  };

  let template = fs.readFileSync(opts.filename).toString();
  let output = ejs.render(template, vals, opts);
  if (argv['output-file']) {
    if (Array.isArray(argv['output-file'])) {
      throw new Error('Please provide a single string for output file. (Run ejs -h for help)');
    }
    fs.writeFileSync(argv['output-file'], output);
  }
  else {
    process.stdout.write(output);
  }
  process.exit(0);

}

// Defer execution so that stdin can be read if necessary
setImmediate(run);
