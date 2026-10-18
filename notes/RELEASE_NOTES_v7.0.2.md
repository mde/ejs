# EJS Version 7.0.2 Release Notes

## Overview
EJS version 7.0.2 is a patch release. It fixes the CLI's `--version` and `--help`
output, fixes three rendering edge cases, and speeds up template compilation.
There are no breaking changes.

## Bug Fixes

### CLI
- **`ejs -V`, `-v`, and `--version` printed `undefined`**: The CLI read
  `ejs.VERSION`, which was removed from the library in v4. It now reads the version
  from `package.json`.
- **`ejs -h` and `--help` printed raw placeholders**: The help text showed literal
  `{Usage}`, `{Options}`, and `{Examples}`, which the old Jake-based parser used to
  fill in. The help text also had wrong option docs:
  - `--strict` implies `--no-with`, not the other way around.
  - `--locals-name` takes a `NAME` value.

### Rendering
- **Empty templates from an includer**: An `includer` that returned
  `{template: ''}` was ignored, so EJS loaded the file instead. An empty string is
  now rendered as an empty template.
- **`renderFile` with `null` or `undefined` data**: `renderFile(path, null)`
  threw synchronously instead of rendering, returning a Promise, or calling the
  callback. Nullish data is now treated as no data.
- **Literal tags with unusual custom delimiters**: With delimiters such as `"` or
  `\`, the literal `<%%` and `%%>` tags broke the generated function. A delimiter
  pair such as `$` and `&` produced duplicated text. Literal tags now output
  correctly with any delimiters.

## Performance
- **Faster compilation**: The template scanner no longer rebuilds the delimiter tag
  strings for every token, and it counts newlines without allocating arrays.
  Compiling a large template without `cache: true` is about 1.6x faster. Output is
  unchanged.

## Documentation
- **Whitespace tags**: Corrected the docs for `<%_` and `_%>`. They strip spaces
  and tabs (plus one newline after `_%>`), not all whitespace. The docs for
  `rmWhitespace` described line slurping that was removed in v2.5.4; they now
  describe what it does.
- **CONTRIBUTING.md**: New contribution guidelines, including a policy on
  AI-generated pull requests.
- **Release notes**: Added notes for v6 and v7, and moved all release notes into
  `notes/`.

## Contributors
- mde (Matthew Eernisse)
- Krishna Anubhav (@heykav): `--version` fix, #821

## Installation

```bash
npm install ejs@7.0.2
```

---

*Generated from git log: v7.0.1..v7.0.2*
