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

let parseargs = {};

let hasOwnProperty = Object.prototype.hasOwnProperty;
let hasOwn = function (obj, key) { return hasOwnProperty.call(obj, key); };

// A token is "option-like" if it begins with a dash. Such a token is never
// consumed as an option-argument (a value that really starts with '-' must be
// passed with '='), which turns the common "forgot the value" mistake into an
// error instead of silently eating the next flag.
let isOptionLike = function (s) {
  return typeof s === 'string' && s.length > 0 && s.charAt(0) === '-';
};

/**
 * @constructor
 * Parses command-line args into options and opaque operands.
 *
 * @param {Array} opts Option specs: `[{full, abbr, expectValue}]`. `expectValue`
 *   truthy means the option takes a value; otherwise it is a boolean flag.
 *
 * `parse(argv)` returns `{opts, operands, errors}`:
 *   - `opts`: null-prototype map of `full-name -> string | true` (last wins)
 *   - `operands`: opaque positional args, in order (NOT split on '=')
 *   - `errors`: `[{code, arg}]`, collected — never thrown. Codes:
 *       'unknown-option', 'missing-value', 'unexpected-value'
 *
 * The parser is pure: no I/O, no exit, and it does not mutate `argv`.
 */
parseargs.Parser = function (opts) {
  // null-prototype lookup tables so inherited members ('constructor',
  // 'toString', '__proto__', ...) can never resolve as a known option
  this.short = Object.create(null);
  this.long = Object.create(null);
  let self = this;
  [].forEach.call(opts, function (item) {
    self.short[item.abbr] = item;
    self.long[item.full] = item;
  });
};

parseargs.Parser.prototype.parse = function (argv) {
  let opts = Object.create(null);
  let operands = [];
  let errors = [];

  let self = this;
  let longSpec = function (name) { return hasOwn(self.long, name) ? self.long[name] : null; };
  let shortSpec = function (ch) { return hasOwn(self.short, ch) ? self.short[ch] : null; };

  let i = 0;
  let n = argv.length;
  let endOfOpts = false;

  while (i < n) {
    let arg = argv[i];

    // Everything after a bare '--' is an operand, even if it looks like an option.
    if (endOfOpts) {
      operands.push(arg);
      i++;
      continue;
    }
    if (arg === '--') {
      endOfOpts = true;
      i++;
      continue;
    }

    // Long option: --name or --name=value  ('=' splits on the FIRST '=' only)
    if (arg.slice(0, 2) === '--') {
      let body = arg.slice(2);
      let eq = body.indexOf('=');
      let name = eq === -1 ? body : body.slice(0, eq);
      let attached = eq === -1 ? null : body.slice(eq + 1);
      let spec = longSpec(name);

      if (!spec) {
        errors.push({ code: 'unknown-option', arg: '--' + name });
        i++;
        continue;
      }
      if (spec.expectValue) {
        if (attached !== null) {
          opts[spec.full] = attached;
          i++;
        }
        else {
          let next = argv[i + 1];
          if (next === undefined || isOptionLike(next)) {
            errors.push({ code: 'missing-value', arg: '--' + name });
            i++;
          }
          else {
            opts[spec.full] = next;
            i += 2;
          }
        }
      }
      else {
        if (attached !== null) {
          errors.push({ code: 'unexpected-value', arg: '--' + name });
        }
        else {
          opts[spec.full] = true;
        }
        i++;
      }
      continue;
    }

    // Short option(s): -x, -xyz (grouped), -xVALUE (attached), -x=VALUE
    if (arg.charAt(0) === '-' && arg.length > 1) {
      let j = 1;
      let consumedNext = false;
      while (j < arg.length) {
        let ch = arg.charAt(j);
        let spec = shortSpec(ch);
        if (!spec) {
          errors.push({ code: 'unknown-option', arg: '-' + ch });
          break; // stop peeling this token on the first unknown char
        }
        if (spec.expectValue) {
          // The rest of the token is the value; a single leading '=' is a
          // separator (so -o=-weird.html -> '-weird.html', -m=| -> '|').
          let rest = arg.slice(j + 1);
          if (rest.length > 0) {
            if (rest.charAt(0) === '=') {
              rest = rest.slice(1);
            }
            opts[spec.full] = rest;
          }
          else {
            let next = argv[i + 1];
            if (next === undefined || isOptionLike(next)) {
              errors.push({ code: 'missing-value', arg: '-' + ch });
            }
            else {
              opts[spec.full] = next;
              consumedNext = true;
            }
          }
          break; // a value-taking option ends the group
        }
        opts[spec.full] = true; // boolean flag; keep peeling
        j++;
      }
      i += consumedNext ? 2 : 1;
      continue;
    }

    // A bare '-' is not an operand and not a valid value.
    if (arg === '-') {
      errors.push({ code: 'unknown-option', arg: '-' });
      i++;
      continue;
    }

    // Anything else is an opaque operand.
    operands.push(arg);
    i++;
  }

  return {
    opts: opts,
    operands: operands,
    errors: errors
  };
};

export default parseargs;
