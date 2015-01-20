The `ejs` CLI Application
=========================

EJS provides an easy-to-use CLI application that renders the given EJS string
or file(s), and either outputs it to a file or to standard output.

Synopsis
--------

```
ejs [option]... [dir|file]...
echo <string> | ejs [option]...
```

Options
-------

<dl>
<dt>-h, --help</dt>
  <dd>output usage information</dd>

<dt>-V, --version</dt>
  <dd>output the version number</dd>

<dt>-O, --opts <str|path></dt>
  <dd>options from JavaScript object string or JSON file</dd>

<dt>-l, --locals <str|path></dt>
  <dd>locals from JavaScript object string or JSON file</dd>

<dt>-o, --out <dir></dt>
  <dd>output the compiled html to <dir></dd>

<dt>-p, --path <path></dt>
  <dd>filename used to resolve includes</dd>

<dt>-d, --delimiter <char></dt>
  <dd>delimiter to use for denoting JS code</dd>

<dt>-c, --client</dt>
  <dd>compile function for client-side runtime</dd>

<dt>-D, --no-debug</dt>
  <dd>compile without debugging (smaller functions)</dd>

<dt>-w, --watch</dt>
  <dd>watch files for changes and automatically re-render</dd>

<dt>-E, --extension <ext></dt>
  <dd>specify the output file extension</dd>
</dl>

Examples
--------

- Render all EJS files in the `templates` directory

  ```
  $ ejs templates
  ```

- Create `{foo,bar}.html`

  ```
  $ ejs {foo,bar}.ejs
  ```

- Read `my.ejs` and output to `my.html` through standard input/output
      
  ```
  $ ejs < my.ejs > my.html
  ```

- Read EJS string from standard input and output to standard output

  ```
  $ echo '<%= "hello ejs" %>' | ejs
  ```

- Render all EJS files in `foo` and `bar` directories and output all files to
  `/tmp`

  ```
  $ ejs foo bar --out /tmp
  ```
