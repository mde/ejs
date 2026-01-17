# EJS Version 4.0.1 Release Notes

## Overview
EJS version 4.0.1 represents a major release with significant architectural improvements,
enhanced module support, and improved compatibility. The CommonJS build is now compiled
using the TypeScript compiler, ensuring better code quality, maintainability, and
backward compatibility.

## Major Changes

### Module System Overhaul
- **Dual module support**: Added support for both CommonJS (`lib/cjs/ejs.js`) and ES
  Modules (`lib/esm/ejs.js`)
- **Package exports**: Implemented proper `exports` field in package.json for better
  module resolution
- **Code generation improvements**: Replaced `let` in code-generation strings for
  CommonJS compatibility
- **Namespace Node builtins**: Improved isolation and compatibility by namespacing
  Node.js built-in modules

### Compatibility
- **Extended Node.js support**: Maintained compatibility with Node.js versions back to
  0.12.18
- **Cleaner keyword replacement**: Improved handling of JavaScript keywords in
  templates

### Build System
- **Compilation task**: Added new compile task with updated linting configuration
- **Build improvements**: Enhanced build process to run before tests
- **Test infrastructure**: Added `testOnly` task for running tests without building
- **Version string**: Version string is now baked in during packaging process

### Documentation
- **JSDoc updates**: Complete JSDoc overhaul with updated paths and references
- **Documentation fixes**:
  - Fixed missing closing parenthesis in async option description (#766)
  - Updated JSDoc reference from usejsdoc.org to jsdoc.app (#778)
- **Removed outdated docs**: Cleaned up old documentation files

### Dependencies
- **Development dependencies**: Updated various dev dependencies including ESLint,
  TypeScript, and build tools
- **Removed lockfiles**: Removed package-lock.json from repository

### Code Quality
- **Linting**: Updated ESLint configuration for better code quality
- **Code cleanup**: Removed unused imports and cleaned up codebase
- **Test fixes**: Fixed failing tests to ensure stability

## Breaking Changes

### Package Structure
- **Main entry point**: Changed from `./lib/ejs.js` to `./lib/cjs/ejs.js`
- **Module entry**: New `module` field points to `./lib/esm/ejs.js`
- **Exports field**: New `exports` field defines import/require paths

## Contributors
- mde (Matthew Eernisse)
- Adnan Tahir (#766)
- Thomas Skardal (#778)

## Migration Guide

If you're upgrading from version 3.x:

1. **ES Modules**: Standard ESM imports continue to work as before. The `exports` field
   automatically routes imports to the correct module:
   ```javascript
   // Works in Node.js, Deno, and other ESM environments
   import ejs from 'ejs';
   ```

   **Deno users**: EJS is now importable via npm specifier:
   ```javascript
   import ejs from 'npm:ejs';
   ```

2. **CommonJS**: CommonJS usage continues to work as before. The `exports` field
   automatically routes `require()` calls to the CommonJS build:
   ```javascript
   const ejs = require('ejs');
   ```

3. **No code changes required**: The new package structure is transparent to users
   thanks to the `exports` field. Your existing code should work without modifications.

## Installation

```bash
npm install ejs@4.0.1
```

---

*Generated from git log: v3.1.10..v4.0.1*
