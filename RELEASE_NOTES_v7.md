# EJS Version 7.0.1 Release Notes

## Overview
EJS version 7.0.1 is a major release that replaces the CLI's argument parser,
removes the Express 2 compatibility layer that read options out of the data
object, and selects the browser bundle through the package's conditional exports.

## Major Changes

### CLI
- **New argument parser**: The CLI uses a parser built for EJS instead of the one
  inherited from Jake. It supports:
  - grouped short flags (`-sdw`)
  - attached short values (`-m$`, `-m'|'`)
  - long options with `=` (`--delimiter=$`)
  - a `--` terminator, for templates whose names start with `-`
- **Unknown options are errors** (Fixes #690): `ejs --foo t.ejs` now prints
  `ejs: unrecognized option '--foo'` and exits instead of ignoring the option.
- **Missing values are errors**: An option that needs a value but is followed by
  another option (`-o -d`) is reported as missing its value. A value that starts
  with `-` must be attached with `=`, as in `-o=-out.html`.
- **Exit status**: 0 on success, 2 for a usage error, and 1 for a runtime error.
  Errors are short messages on stderr, not stack traces.
- **Argument order**: The template file is always the first non-option argument.
  Any `name=value` data comes after it.
- **stdin**: JSON on stdin is read only when no other data source (`-i`, `-f`, or
  `name=value`) is given, so the CLI never waits on stdin when data came another
  way. Passing both `-i` and `-f` is an error.

### API
- **Options are no longer read from the data object**: `ejs.render(template, data)`
  used to promote option-named keys in `data` (such as `delimiter`, `strict`,
  `rmWhitespace`, `debug`, and `async`) into options. They are now ordinary
  locals. This was compatibility for Express 2, which passed locals and options in
  one object.
- **`renderFile` and Express settings**: `renderFile` still reads `settings.views`
  and `settings['view cache']`, which current Express passes. It no longer copies
  options out of the data object or reads `settings['view options']`, which
  Express 3 dropped.

### Packaging
- **Browser export condition** (Fixes #805, PR #816): The `exports` map now
  includes a `browser` condition that points to `ejs.min.js`. Bundlers targeting
  the browser, such as Webpack's `web` target, get the prebuilt browser bundle
  instead of the Node entry. Node, Deno, and Bun still get the Node entries.

### Documentation
- **Escaping**: The README and SECURITY.md explain that `<%= %>` escapes for
  HTML content and quoted attribute values only. In other contexts (`<script>`
  blocks, CSS, SQL, shell commands), use your own escape function.
- **README**: Removed a broken docs link (#813), and updated the CLI section for
  v7.

## Breaking Changes

### Options in the data object
- **What changed**: Options inside the data object are ignored. That includes
  options set in Express `app.locals` and `settings['view options']`.
- **Migration**: Pass options as the third argument:
  `ejs.render(str, data, {delimiter: '?'})`. With Express, register a custom
  engine function that passes options to `ejs.renderFile`. The ejs.co docs have an
  example.

### CLI behavior
- **Unknown options now fail** with exit status 2. Remove or fix them.
- **The template must come before data values**: `ejs name=x t.ejs` is now an
  error. Use `ejs t.ejs name=x`.
- **stdin is a fallback**: It is no longer the highest-precedence data source.
  When `-i`, `-f`, or `name=value` data is given, stdin isn't read at all, so
  stdin JSON and `name=value` values no longer combine.
- **Values that start with `-`** need `=`, as in `-o=-out.html`.

## Contributors
- mde (Matthew Eernisse)
- Sridhar Bala (browser export condition, #816)
- Ryan Zimmerman (README fix, #813)

## Migration Guide

If you're upgrading from version 6.x:

1. **If you pass options inside the data object**, as in
   `ejs.render(str, {delimiter: '?', name})`: Move them to the third argument.
   Plain data with options passed separately works as before.

2. **If you set EJS options through Express** (`app.locals` or
   `app.set('view options', ...)`): Use a custom engine function that passes
   options to `ejs.renderFile`. The `views` setting and the view cache keep
   working as before.

3. **If you script the CLI**: Put the template first, check for exit status 2 on
   usage errors, and remove unknown options. If your scripts relied on the old
   option handling, check them against `ejs -h`.

4. **If you bundle EJS for the browser**: No changes are needed. The browser bundle
   is now picked automatically.

## Installation

```bash
npm install ejs@7.0.1
```

---

*Generated from git log: v6.0.1..v7.0.1*
