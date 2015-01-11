## v2.1.0: UNRELEASED

+ Add `_with` option to control whether or not to use `with() {}` constructs
  (@TimothyGu)
+ Revert hack for Etherpad Lite (@TimothyGu)

## v2.0.9: UNRELEASED

+ Do not claim node < 0.10.0 support (@TimothyGu)
+ Pin dependencies more loosely (@TimothyGu)
+ Fix client function generation without using locals (@TimothyGu)
+ Fix error case where the callback be called twice (@TimothyGu)
+ Improve test coverage (@mde & @TimothyGu)
+ Add `"use strict";` to all JS files (@TimothyGu)
+ Add a few more metadata fields to `package.json` (@TimothyGu)
+ Fix absolute path inclusion (@TimothyGu) (#11)

## v2.0.8: 2015-01-06

+ Fix crash on missing file

## v2.0.7: 2015-01-05

+ Linting and cosmetics

## v2.0.6: 2015-01-04

+ Temporary hack for Etherpad Lite. It will be removed soon.

## v2.0.5: 2015-01-04

+ Fix leaking global `fn`

## v2.0.4: 2015-01-04

+ Fix leaking global `includeSource`
+ Update client-side instructions

## v2.0.3: 2015-01-04

+ Add Travis CI support
+ Add LICENSE file
+ Better compatibility with EJS v1 for options
+ Fix typos in examples in README
+ Add `debug` option

## v2.0.2: 2015-01-03

+ Use lowercase package name in `package.json`

## v2.0.0: 2015-01-02

+ Completely rewritten
+ Removed support for filters
+ Single custom delimiter (e.g., `?`) with `delimiter` option instead of
  `open`/`close` options
+ Data and options now separate params (i.e., `render(str, data, options);`)
+ `include` now runtime function call instead of preprocessor directive
+ Variable-based includes now possible
+ Comment tag support (<%%)
