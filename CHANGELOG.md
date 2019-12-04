## v3.0.1: 2019-11-23
  * Removed require.extensions (@mde)
  * Removed legacy preprocessor include (@mde)
  * Removed support for EOL Nodes 4 and 6 (@mde)

## v2.7.4: 2019-11-19
### Bug fixes

- Fixed Node 4 support, which broke in v2.7.3 ([`5e42d6c`](https://github.com/mde/ejs/commit/5e42d6cef15ae6f2c7d29ef55a455e8e49b5e76e), [@mde](https://github.com/mde))

## v2.7.3: 2019-11-19
### Bug fixes

- Made the post-install message more discreet by following the example of [opencollective-postinstall](https://github.com/opencollective/opencollective-postinstall) ([`228d8e4`](https://github.com/mde/ejs/commit/228d8e45b7ced2afd3e596c13d44aed464e57e43), [@mde](https://github.com/mde))

## v2.7.2: 2019-11-13
### Features

- Added support for destructuring locals ([#452](https://github.com/mde/ejs/pull/452), [@ExE-Boss](https://github.com/ExE-Boss))
- Added support for disabling legacy `include` directives ([#458](https://github.com/mde/ejs/pull/458), [#459](https://github.com/mde/ejs/pull/459), [@ExE-Boss](https://github.com/ExE-Boss))
- Compiled functions are now shown in the debugger ([#456](https://github.com/mde/ejs/pull/456), [@S2-](https://github.com/S2-))
- `function.name` is now set to the file base name in environments that support this ([#466](https://github.com/mde/ejs/pull/466), [@ExE-Boss](https://github.com/ExE-Boss))

### Bug Fixes

- The error message when `async != true` now correctly mention the existence of the `async` option ([#460](https://github.com/mde/ejs/pull/460), [@ExE-Boss](https://github.com/ExE-Boss))
- Improved performance of HTML output generation ([#470](https://github.com/mde/ejs/pull/470), [@nwoltman](https://github.com/nwoltman))

## v2.7.1: 2019-09-02
  * Added deprecation notice for use of require.extensions (@mde)

## v2.6.2: 2019-06-19
  * Correctly pass custom escape function to includes (@alecgibson)
  * Fixes for rmWhitespace (@nwoltman)
  + Examples for client-side EJS compiled with Express middleware (@mjgs)
  + Make Template constructor public (@ThisNameWasTaken)
  + Added `remove` function to cache (@S2-)
  * Recognize both 'Nix and Windows absolute paths (@mde)

## v2.6.1: 2018-04-18
  * Async rendering (@Viko)

## v2.5.9: 2018-04-18
  * Fixed options-passing for Express (@mde)
  * Re-enabled performance tests (@mde)

## v2.5.8: 2018-03-25

 + Add filename to error when include file cannot be found (@Leon)
 + Node v9 in CI (@Thomas)
 * Fixed special case for Express caching (@mde)
 + Added Promise/async-await support to `renderFile` (@mde)
 + Added notes on IDE support to README (@Betanu701)

## v2.5.7: 2017-07-29

 * Pass configured escape function to `rethrow` (@straker)
 + Added vulnerabilities info into README (@mde)
 * Avoid creating function object in hot execution path (@User4martin)
 + Added benchmark (@User4martin)
 + Tests for looped includes (@User4martin)

## v2.5.6: 2017-02-16

 * Use configured escape function for filenames in errors (@mde)
 + Make file-loader configurable to allow template pre-processing (@hacke2)
 * Improved `renderFile` performance (@nwoltman)

## v2.5.5: 2016-12-06

* Allow 'filename' for opts-in-data, but sanitize when rendered (@mde)

## v2.5.4: 2016-12-05

* Blackist more options from opts-in-data (@mde)
* Allow trailing comments in output modes (@mde)
+ Added 'name' attribute for easy identification (@designfrontier)

## v2.5.3: 2016-11-28

* Blackist 'root' option from opts-in-data (@mde)

## v2.5.2: 2016-07-25

+ Added link to EJS Playground (@RyanZim)
- Revert express auto 'root' option (@RyanZim)

## v2.5.1: 2016-07-25

+ Output literal `%>` with `%%>` (Roy Miloh)
+ Allow setting project root for includes (@cnwhy)
+ UMD support for the browser (@RyanZim)
+ Exported `escapeXML` method to allow manual escaping of output (@mde)
+ Tests for strict mode (@RyanZim, @mde)
+ Added ESLint for project source code (@mde)
* Whitespace slurp in preprocessor include (@mmis1000)
* Improved line-number handling in errors (@Spikef)
* Various doc improvements (@RyanZim, Ionică Bizău)

## v2.4.2: 2016-05-24

+ Added LICENSE file to release package
* Various documentation improvements (@RyanZim)
* Better line-numbers in errors (@dgofman)

## v2.4.1: 2016-01-23

+ Strict-mode support (@mde)
+ Express 4 support (@mde)
+ Configurable localsName option (@mde)

## v2.3.4: 2015-09-04

+ Whitespace slurp tag syntax -- `<%_  _%>` (@andidev)

## v2.3.3: 2015-07-11

* Fixed false positives for old `include` preprocessor directive (@mde)

## v2.3.2: 2015-06-28

* Do not require semicolons in `<%- %>` (@TimothyGu)
* Use `__append` instead of `pushToOutput` (@dominykas)
* Cache the character-encoding function (@alubbe)
* Correctly specify execution context with opts.context (@mde)

## v2.3.1: 2015-02-22

* Stop deferring execution of `renderFile` callback, revert to sync
  execution (@mde)
+ Generated template functions are now prettier (@whitneyit)
+ Add official documentation for EJS syntax (#9) (@TimothyGu)
+ Add inline JSDoc-style documentation for public functions (#9) (@TimothyGu)
+ Add a new dynamic client-side template compilation example in
  `examples/client-compile.html` (@TimothyGu)
* Fix running on Node.js v0.8. Note that we still do not support 0.8
  officially, but if you found something that can be fixed easily please
  point it out. (#57) (@TimothyGu)
* Do not trim newlines at the end of files. This might be considered
  incompatible by some, but the new behavior is the correct one, and is
  consistent with EJS v1. (#60) (@TimothyGu)
* Readd deprecation warning for `scope` option that was removed in v2.2.4. It
  never caused any problems with Express or anything else so its removal was
  a mistake. (@TimothyGu)
* Always rethrow the error from `new Function()` (@TimothyGu)

## v2.2.4: 2015-02-01

+ Ability to customize name of the locals object with `ejs.localsName` (@mde)
+ Ability to override `resolveInclude` for include-path lookup
  (@olivierkaisin)
* Only bundle rethrow() in client scripts when compileDebug is enabled
  (@TimothyGu)
* Copy `_with` from locals object to options object (@TimothyGu)
* Removed deprecation warnings (@mde)
* Significantly increased performance (@TimothyGu)
* Defer execution for `renderFile` callback, ensure async (@TimothyGu)

## v2.2.3: 2015-01-23

* Better filtering for deprecation notice when called from Express (@mde)

## v2.2.2: 2015-01-21

* Fix handling of variable output containing semicolons (@TimothyGu)
* Fix included files caching (@TimothyGu)
* Simplified caching routine (@TimothyGu)
* Filter out deprecation warning for `renderFile` when called from
  Express (@mde)

## v2.2.1: 2015-01-19

+ 4x faster HTML escaping function, especially beneficial if you use lots
  of escaped locals (@TimothyGu)
+ Up to 4x faster compiled functions in addition to above (@TimothyGu)
+ Caching mode regression test coverage (@TimothyGu)
* Fix `//` in an expanded string (@TimothyGu)
* Fix literal mode without an end tag (@TimothyGu)
* Fix setting options to renderFile() through the legacy 3-argument interface
  (as is the case for Express.js) (@TimothyGu)
+ Added version string to exported object for use in browsers (@mde)

## v2.1.4: 2015-01-12

* Fix harmony mode (@mde)

## v2.1.3: 2015-01-11

* Fix `debug` option (@TimothyGu)
* Fix two consecutive tags together (@TimothyGu)

## v2.1.2: 2015-01-11

* Fix `scope` option handling
+ Improve testing coverage (@TimothyGu)

## v2.1.1: 2015-01-11

+ Add `_with` option to control whether or not to use `with() {}` constructs
  (@TimothyGu)
+ Improve test coverage (@mde & @TimothyGu)
+ Add a few more metadata fields to `package.json` (@TimothyGu)
- Revert hack for Etherpad Lite (@TimothyGu)
* Do not claim node < 0.10.0 support (@TimothyGu)
* Pin dependencies more loosely (@TimothyGu)
* Fix client function generation without using locals (@TimothyGu)
* Fix error case where the callback be called twice (@TimothyGu)
* Add `"use strict";` to all JS files (@TimothyGu)
* Fix absolute path inclusion (@TimothyGu) (#11)

## v2.0.8: 2015-01-06

* Fix crash on missing file

## v2.0.7: 2015-01-05

* Linting and cosmetics

## v2.0.6: 2015-01-04

* Temporary hack for Etherpad Lite. It will be removed soon.

## v2.0.5: 2015-01-04

* Fix leaking global `fn`

## v2.0.4: 2015-01-04

* Fix leaking global `includeSource`
* Update client-side instructions

## v2.0.3: 2015-01-04

+ Add Travis CI support
+ Add LICENSE file
+ Better compatibility with EJS v1 for options
+ Add `debug` option
* Fix typos in examples in README

## v2.0.2: 2015-01-03

* Use lowercase package name in `package.json`

## v2.0.1: 2015-01-02

+ Completely rewritten
+ Single custom delimiter (e.g., `?`) with `delimiter` option instead of
  `open`/`close` options
+ `include` now runtime function call instead of preprocessor directive
+ Variable-based includes now possible
+ Comment tag support (`<%#`)
* Data and options now separate params (i.e., `render(str, data, options);`)
- Removed support for filters
