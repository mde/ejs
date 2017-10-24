EJS Snippet (plug-in) Reference
==============================

The Locals plug-in is based on the functionality of 
https://github.com/RandomEtc/ejs-locals

Locals are not available if opts.client is used.

Table of contents
-----------------

- Activating the plug-in
- layout
- block
  - script
  - stylesheet
- partial


Activating the plug-in
---------------------

The plug-in is activated by requiring it.

`require('ejs/plug-ins/ejs-locals');`

This modifies the global instance of ejs. So any code using `require('ejs');`
will have an ejs with the plug-in activated.

layout
------

A layout is a wrapper around the current template. 

Example:

Template "page":
`Hello world <% layout("layout-bold") %>`

Template "layout-bold"
`<b><%- body %></b>`

Rendering the template "page" will:

- Get the rendered result of "page"
- render "layout-bold", passing the result of "page" as the locals value "body"
- return the result of "layout-bold" to the app.


block
-----

`<% block("foo", "data" %>`: stores "data" as "foo".

`<% block("foo", "more data" %>`: appends "more data" to "foo" (with a newline)

`<%- block("foo" %>`: inserts the content of foo


### script

`<% script("SOURCE" %>`: adds a script tag `<script src="SOURCE"></script>`

`<% script("SOURCE", "TYPE" %>`: adds a script tag `<script src="SOURCE" type="TYPE"></script>`

script tags are joined with newlines.

`<%- script() %>': insert the script tags

### stylesheet

`<% stylesheet("SOURCE" %>`:  adds a script tag `<link rel="stylesheet" href="SOURCE" />`

`<% stylesheet("SOURCE", "MEDIA" %>`: adds a script tag `<link rel="stylesheet" href="SOURCE" media="MEDIA" />`

stylesheet tags are joined with newlines.

`<%- stylesheet() %>': insert the stylesheet tags


partial
-------

An extended version of include.

Partials are searched as follows

- relative file names resolve according to the directory of the current template
- absolute file names resolve in opts.root (or / if opts.root is not set)

The following file names are looked up (example `<%- partial("foo/bar") %>`:

- foo/_bar.ejs
- foo/bar.ejs
- foo/bar/index.ejs

Partials can be called as `<%- partial("foo/bar") %>` or `<%- partial("foo/bar", data) %>`

Partials will see the locals, as is at the time they are called.

If data is given, it can be:

- An object (plain object)

The plain object is merged to locals.


- An object (plain object) with a "object" key.
- An object with a custom constructor

This object is passed on a special key in the locals (see collection below)
  
  
- An object (plain object) with a "collection" key.
- An array of object (or a collection).

The partial is called for each entry.

The entry is put an a special key in the locals.

The key can be given in the plain object under "as" (unless an array is passed).
Otherwise it derived from the file name of the partial.
(foo/bar_some.ejs will become barSome)

