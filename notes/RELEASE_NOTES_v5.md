# EJS Version 5.0.1 Release Notes

## Overview
EJS version 5.0.1 is a major release that removes deprecated options, fixes template
behavior with custom delimiters, improves the CLI and build pipeline, and simplifies
the package by moving Jake to a dev-only dependency.

## Major Changes

### Deprecated Option Removed
- **Removed `client` option** (Fixes #746): The legacy `client` flag and related
  code have been removed. This option produced browser-oriented template functions
  by inlining escape and rethrow helpers; it was unmaintained and broken. Use the
  standard browser bundle (`ejs.min.js`) or compile templates for the client using
  your own build setup.

### Bug Fixes
- **Custom delimiters and whitespace-slurp tags** (Fixed #780): Whitespace-slurp
  tags (`<%_` and `_%>` by default) now respect custom `openDelimiter`, `delimiter`,
  and `closeDelimiter`. Previously, the slurp regex was hardcoded to `<%`/`%>`,
  so custom delimiters did not work correctly with `<%_`/`_%>`-style tags.

### CLI & Build
- **CLI no longer depends on Jake**: The `ejs` CLI now uses a bundled argument
  parser (`lib/esm/parseargs.js` / `lib/cjs/parseargs.js`) instead of the Jake
  program module. Jake remains a devDependency for the build (lint, compile,
  browserify, minify, test).
- **Jake moved to devDependencies**: Jake was moved from `dependencies` to
  `devDependencies`, so installing `ejs` as a dependency no longer pulls in Jake.
- **Minification fix**: The minify task now minifies the browserified `ejs.js`
  bundle (output of the browserify task) instead of `lib/cjs/ejs.js`, so the
  browser bundle is correctly minified.

### Documentation & Examples
- **JSDoc updates**: Removed references to the `client` option and `ClientFunction`
  from options and template-function documentation.
- **Examples**: `examples/client-compilation.html` and `examples/express/app.js`
  updated to remove use of the `client` option; Express example no longer passes
  `client: true`.
- **README**: Removed broken link to the third-party EJS playground.

### Code Quality
- **Tests**: Removed tests that targeted the removed `client` option behavior.
- **Utils**: Removed unused `client`-related code from `lib/esm/utils.js`.

## Breaking Changes

### Removed `client` Option
- **Option removed**: The `client` option is no longer supported. Passing
  `client: true` (or any value) is ignored; no error is thrown, but no
  client-specific output is produced.
- **Migration**: Rely on the standard API and the browser build (`ejs.min.js`) for
  browser use, or compile templates in your own build pipeline if you need
  client-side rendering with custom setup.

## Contributors
- mde (Matthew Eernisse)

## Migration Guide

If you're upgrading from version 4.x:

1. **If you used the `client` option**: Remove `client: true` (or similar) from
   your options. Use `ejs.render()` or `ejs.renderFile()` as usual; for browsers,
   load `ejs.min.js` or bundle the CJS/ESM build. If you depended on the old
   client output format, you will need to implement your own client compilation
   or use a different approach.

2. **If you use custom delimiters with whitespace-slurp tags**: Upgrading fixes
   behavior so that tags like `<%_` and `_%>` are correctly recognized when
   `openDelimiter`, `delimiter`, or `closeDelimiter` are set. No code changes
   required.

3. **Install size**: Installing `ejs` as a dependency no longer installs Jake,
   which may slightly reduce install size and dependency tree depth.

## Installation

```bash
npm install ejs@5.0.1
```

---

*Generated from git log: v4.0.1..v5.0.1*
