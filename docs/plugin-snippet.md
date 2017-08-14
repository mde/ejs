EJS Snippet (plug-in) Reference
==============================

The Snippet plug-in lets you define snippets (aka Blocks) and use them
anywhere in your template. This works across include boundaries.

Table of contents
-----------------

- Activating the plug-in
- Defining Snippets
- Calling Snippets
- Snippets and included templates
  - Calling Snippets in included templates
  - Defining Snippets in included templates
  - Including templates inside a Snippet


Activating the plug-in
---------------------

The plug-in is activated by requiring it.

`require('ejs/plug-ins/ejs-snippet');`

This modifies the global instance of ejs. So any code using `require('ejs');`
will have an ejs with the plug-in activated.

Defining Snippets
-----------------

### Definition

To define a snippet use:

`<%* snippet name %> content <%* /snippet %>`

"content" can be anything, including any ejs code.

If content contains ejs code, then this will not be executed until the snippet
is called.
That is any `<%= val %>` or `<% if(val) { %>` will be kept as they are, and
only be executed when they snippet is called. They therefore see the values
the snippet is called with, not the values at definition time.

### Hoisting

Snippets are hoisted.

A snippet defined anywhere in a template, can be used anywhere in this 
template. Even before its definition.

This is useful if snippets call each other in a recursion.

Snippets capture a shallow copy of the "locals". Locals are captured as they
are at the start of the template. That is any changes made to locals by
scriptlets in the template will not be seen by the snippet. (Except where 
a shallow copy does not preserve the data).

```
<% foo = 'replacement' %>
<%* snippet name %> <%=foo%> <%* /snippet %>
```

The snippet captures the locals *before* foo gets changed.

### Nesting

Snippets can *not* be nested.

Calling Snippets
----------------

Snippets are called using the `snippet()` function (similar to "include" templates).
The function takes one or two arguments.

```
<%- snippet("name") %>
<%- snippet("name", { foo: 5 }) %>
```

The "snippet" function is available in any javascript part of the ejs template.

Calling the snippet() function is running the snippet, treating the snippet as
a template of its own.
The snippet will see the values for locals captured as described in 
"Defining Snippets".
If the 2nd argument is given, the values from the 2nd argument are merged to
the captured locals.

Snippets can call other snippets including them self.

Snippets and included templates
-------------------------------

Defining and calling snippets in templates called by `include()`

### Calling Snippets in included templates

Included templates can access any snippet that is available in the outer
template at the time the `include()` is executed.

A snippet is "available" if:

- it is defined anywhere in the outer template.
- if the outer template is an include itself and the snippet is available to
  it, from the outer's outer template.
- if the outer template got the snippet from another `include()` (see below)


### Defining Snippets in included templates

If a template is included, then all snippets defined in this template will 
become available in the outer template.

Such snippets become available at the time the `include()` is executed.
Once the `include()` was executed they are available anywhere in the outer
template.

If the template "include-me" defines a snippet called "foo"

```
<% for(a=1; i<9; i++) { %>
  <% if(i > 0) { %>
    <% snippet('foo') %>
  <% } %>
  <% include('include-me') %>
<% } %>
```

In the first run of the loop, the snippet "foo" would not be defined. But in
the 2nd run it is defined.

#### Replacing Snippets by included templates

If an included template defines a snippet with the same name as a snippet
available in the outer template, then the snippet from the included template
replaces the snippet from the outer template.

In the included template only the new snippet will be used, as it is hoisted.

In the outer template the snippet will be replaced at the time the `include()`
is executed.


### Including templates inside a Snippet

Snippets can contain `include()` calls. And in the include templates
new snippets can be defined, or existing ones be replaced.
All the rules above apply.

An include can replace the snippet from which it is called.
