#!/usr/bin/env node
/*
 * EJS: Embedded JavaScript templating language
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

let program = require('jake').program;
delete global.jake; // NO NOT WANT

let ejs = require('../lib/ejs');
let fs = require('fs');
let args = process.argv.slice(2);
let usage = fs.readFileSync(`${__dirname}/../usage.txt`).toString();

const CLI_OPTS = [
  { full: 'debug',
    abbr: 'd',
    expectValue: false,
    allowValue: false,
    passThrough: true,
  },
  { full: 'delimiter',
    abbr: 'm',
    expectValue: true,
    passThrough: true,
  },
  { full: 'openDelimiter',
    abbr: 'o',
    expectValue: true,
    passThrough: true,
  },
  { full: 'closeDelimiter',
    abbr: 'c',
    expectValue: true,
    passThrough: true,
  },
  { full: 'strict',
    abbr: 's',
    expectValue: false,
    allowValue: false,
    passThrough: true,
  },
  { full: 'noWith',
    abbr: 'n',
    expectValue: false,
    allowValue: false,
  },
  { full: 'localsName',
    abbr: 'l',
    expectValue: true,
    passThrough: true,
  },
  { full: 'rmWhitespace',
    abbr: 'w',
    expectValue: false,
    allowValue: false,
    passThrough: true,
  },
  { full: 'outputFile',
    abbr: 'f',
    expectValue: true,
  },
  { full: 'root',
    abbr: 'r',
    expectValue: true,
    passThrough: true,
  },
  { full: 'dataFile',
    abbr: 'a',
    expectValue: true,
  },
  { full: 'help',
    abbr: 'h',
    passThrough: true,
  },
  { full: 'version',
    abbr: 'V',
    passThrough: true,
  },
  // Alias lowercase v
  { full: 'version',
    abbr: 'v',
    passThrough: true,
  },
];

let preempts = {
  version: function () {
    program.die(ejs.VERSION);
  },
  help: function () {
    program.die(usage);
  }
};

function run() {

  program.availableOpts = CLI_OPTS;
  program.parseArgs(args);

  let pOpts = program.opts;
  let pVals = program.envVars;
  let templatePath = program.taskNames[0];

  let opts = {};
  let vals = {};

  // Same-named 'passthrough' opts
  CLI_OPTS.forEach((opt) => {
    let optName = opt.full;
    if (opt.passThrough && typeof pOpts[optName] != 'undefined') {
      opts[optName] = pOpts[optName];
    }
  });

  // Bail out for help/version
  for (let p in opts) {
    if (preempts[p]) {
      return preempts[p]();
    }
  }

  if (opts.strict) {
    pOpts.noWith = true;
  }
  if (pOpts.noWith) {
    opts._with = false;
  }

  // Read the data from any data file
  if (pOpts.dataFile) {
    vals = JSON.parse(fs.readFileSync(pOpts.dataFile).toString())
  }
  // Override / set any values passed from the command line
  for (p in pVals) {
    vals[p] = pVals[p];
  }

  let template = fs.readFileSync(templatePath).toString();
  let output = ejs.render(template, vals, opts);
  if (pOpts.outputFile) {
    fs.writeFileSync(pOpts.outputFile, output);
  }
  else {
    console.log(output);
  }
}

run();
