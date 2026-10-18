# EJS Version 6.0.1 Release Notes

## Overview
EJS version 6.0.1 is a major release that hardens template rendering against
prototype-pollution attacks, makes the published ESM build clean for modern
bundlers and runtimes, and adds packaging and ecosystem tests to the build.

## Major Changes

### Security
- **Locals no longer resolve through the prototype chain**: Template functions now
  receive a shallow, null-prototype copy of the data object. Only the data
  object's own properties are visible as top-level locals. Previously, inherited
  properties were visible too, so a polluted `Object.prototype` (for example, a
  planted `escapeFn` or `include`) could hijack template internals.
- **New `unsafePrototypeLocals` option**: Set `unsafePrototypeLocals: true` to
  restore the old prototype-chain lookup. It is off by default, and it can't be
  turned on through a polluted `Object.prototype`. Enabling it makes EJS usable as
  a gadget in prototype-pollution attacks.

### Packaging
- **ESM build no longer contains a CommonJS shim**: Earlier versions ended
  `lib/esm/*.js` with `module.exports = ...` so the same file could act as CJS.
  Modern ESM-aware bundlers and Bun treated that as malformed ESM. The shim now
  lives only in the generated `lib/cjs/*` files. As of v6.0, the package imports
  cleanly under Rollup, Rolldown, tsdown, esbuild, Webpack, Vite, Browserify, Bun,
  and Deno.
- **`require('ejs')` is unchanged**: The CJS entry still exports the `ejs` object
  directly, so `require('ejs') === ejs`, and the same holds for the utils module.
- **Browserify**: Pass `--node` so Browserify picks the `main` entry instead of the
  prebuilt UMD bundle named in the `browser` field.

### Build & Testing
- **Packaging tests**: New `jake test:packaging` task installs the release tarball
  into a scratch project and checks the CJS entry, the ESM entry, and the CLI.
- **Ecosystem smoke tests**: New `jake test:ecosystem` tasks (in
  `jakelib/ecosystem.js`) bundle the release tarball with Rollup, Rolldown,
  tsdown, esbuild, Webpack, and other tools.
- **Jake 12**: The build now uses Jake 12 (a devDependency only), and file cleanup
  uses Node's `fs.rmSync` instead of Jake helpers.

## Breaking Changes

### Prototype-chain locals
- **What changed**: Identifiers in a template resolve only against the data
  object's own properties. Inherited properties, including class getters and
  methods and anything from `Object.create(proto)`, are `undefined` at the top
  level.
- **Who is affected**: Code that passes a class instance or an
  `Object.create(...)` result as the data object and uses its inherited
  properties directly, as in `<%= greet %>`.
- **Migration**: Pass a plain object, such as `{user: instance}`, and use
  `<%= user.greet %>`. Properties of nested objects aren't copied, so they keep
  their prototype chains. Or set `unsafePrototypeLocals: true` if you accept the
  risk.

## Contributors
- mde (Matthew Eernisse)

## Migration Guide

If you're upgrading from version 5.x:

1. **If you pass class instances or `Object.create()` objects as data**: Wrap them
   in a plain object, or set `unsafePrototypeLocals: true`. Plain-object data
   works as before.

2. **If you use EJS through a bundler**: No changes are needed. Bundlers that
   rejected the old ESM file now work. With Browserify, use `--node`.

3. **If you `require('ejs')` or `import ejs from 'ejs'`**: No changes are needed.

## Installation

```bash
npm install ejs@6.0.1
```

---

*Generated from git log: v5.0.2..v6.0.1*
