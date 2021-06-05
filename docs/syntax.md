EJS Syntax Reference
====================

EJS is designed to be flexible and easy-to-write, but without too much
abstractions to cover up the HTML base.

Table of contents
-----------------

- Basic format
- Delimiters
- Starting tags
  - `<%=`: Escaped output
  - `<%-`: Unescaped output
  - `<%#`: Comments
  - `<%`: Scriptlet
  - `<%_`: Scriptlet, removes all preceding whitespace
- Ending tags
  - `%>`: Regular ending tag
  - `-%>`: Removes trailing newline
  - `_%>`: Removes all trailing whitespace
- Literal tags
- Including other files
  - JavaScript `include()` function
- Copyright


Basic format
------------

An EJS “tag” is the primary functioning unit in an EJS template. With the
exception of the literal tags, all tags are formed by the following format:

<pre>&lt;<em>starting</em> <em>content</em> <em>closing</em>&gt;</pre>

The spaces between *starting* and *content*, and *content* and *closing* are
not required; they are recommended though for readability.

Delimiters
----------

The *starting* and *closing* tags contain a special string called the
delimiter. In this document, all tags are shown using the `%` delimiter, which
is the default. You can, however, change that to your liking. See
https://github.com/mde/ejs#custom-delimiters for more information on how to
change it.

Starting tags
-------------

### `<%=`: Escaped output

The most important thing for a template language is the ability to pass
variables to the template. In EJS, this is done with the `<%=` and `<%-` tags.

`<%=` is the starting tag to use for variables that need to be escaped. If the
specified string contains forbidden characters like `<` and `&`, they are
escaped automatically with HTML codes.

The content of the tag can be any valid JavaScript operators, so tags like
`<%= name ? name : (lastName || 'John Doe') %>` would work as intended.

#### Example

##### EJS

```ejs
<p>Hello, <%= name %>.</p>
<p>Hello, <%= 'the Most Honorable ' + name %>.</p>
```

##### Locals

```json
{
  "name": "Timoth<y>"
}
```

##### HTML

```html
<p>Hello, Timoth&lt;y&gt;.</p>
<p>Hello, the Most Honorable Timoth&lt;y&gt;.</p>
```

### `<%-`: Unescaped output

If your local contains preformatted HTML, you might not want to escape it. In
this case, use the `<%-` tag.

However, always **be 100% sure** the rendered local is sanitized, to prevent
cross-site scripting (XSS) attacks.

#### Example

##### EJS

```ejs
<p>Hello, <%- myHtml %>.</p>
<p>Hello, <%= myHtml %>.</p>

<p>Hello, <%- myMaliciousHtml %>.</p>
<p>Hello, <%= myMaliciousHtml %>.</p>
```

##### Locals

```json
{
  "myHtml": "<strong>Timothy</strong>"
, "myMaliciousHtml": "</p><script>document.write()</script><p>"
}
```

##### HTML

```html
<p>Hello, <strong>Timothy</strong>.</p>
<p>Hello, &lt;strong&gt;Timothy&lt;/strong&gt;.</p>

<p>Hello, </p><script>document.write()</script><p>.</p>
<p>Hello, &lt;/p&gt;&lt;script&gt;document.write()&lt;/script&gt;&lt;p&gt;.</p>
```

### `<%#`: Comments

The `<%#` starting tag denotes that the statement is a comment that is not to
be executed or rendered in the resulting HTML.

#### Whitespace

The use of `<%#` might cause some useless whitespace, as illustrated by the
example below. You can trim it using the `-%>` ending tag.

#### Example

##### EJS

```ejs
<div>
<%# comment %>
</div>

<div>
<%# comment -%>
</div>
```

##### HTML

```html
<div>

</div>

<div>
</div>
```

### `<%`: Scriptlets

Scriptlets in the `<%` tag allows logic to be embedded in an EJS template. You
are free to use *any* JavaScript syntax in this tag, and to mix JavaScript
with EJS. You can also put multiple statements in one tag.

#### Comments

All types of JavaScript comments are allowed, although it is preferable to use
the `<%#` tag for comments. For example, the following three code blocks are
equivalent, though `<%#` is the shortest.

```ejs
<%# comment %>
<%/* comment */%>
<%// comment %>
```

#### Curly brackets

Always use brackets in loops and conditionals that involves mixing EJS
template and JavaScript scriptlets. Omitting brackets might work for some
statements, but the behavior is undefined and subject to change.

It is not necessary to use curly brackets for scriptlet-only code.

```ejs
<%# Bad practice %>
<% if (true) %>
  <p>Yay it's true!</p>

<%# Good practice %>
<% if (true) { %>
  <p>Yay it's true!</p>
<% } %>
```

```ejs
<%# These are all valid statements %>
<% var output
     , exclamation = ''
     , shouldOutput = false

   if (true)
     output = 'true!'

   if (true) {
     exclamation = 'Yay! ';
   }

   if (true) shouldOutput = true; %>

<% if (shouldOutput) { %>
  <%= exclamation + 'It\'s ' + output %>
<% } %>
```

#### Line breaks inside a tag

Line breaks are allowed in `<%` tags.

Unless the statement involves mixing EJS and JavaScript scriptlet, always put
complete statements in a tag. For example, the following works:

```ejs
<% var stringToShow = thisIsABooleanVariableWithAVeryLongName
                    ? 'OK'
                    : 'not OK' %>
```

While the following does not:

```ejs
<% var stringToShow = thisIsABooleanVariableWithAVeryLongName %>
<%                  ? 'OK'                                    %>
<%                  : 'not OK'                                %>
```

#### Semicolons

As is in JavaScript, semicolons are not required if proper line breaks are
preserved.

#### Whitespace

The use of scriptlets might cause some useless whitespace, as illustrated by
the example below. You can trim it by

1. using the `-%>` ending tag, and
2. using the `<%_` starting tag or starting the tag in the beginning of a line.

#### Example

In the following example, several different coding styles are used
simultaneously, to show that EJS is flexible with regards to personal habits.
It does *not* mean that we recommend mixing coding styles in your own project.

##### EJS

```ejs
<dl>
<%for (var i = 0; i < users.length; i++) {    %><%
  var user = users[i]
      , name = user.name // the name of the user
    %><%# comment %>
  <%var age  = user.age; /* the age of the user */%>
  <dt><%= name %></dt>
  <dd><%= age %></dd>
<%}-%>
</dl>
```

##### Locals

```json
{
  "users": [
    {
      "name": "Timothy"
    , "age":  15
    }
  , {
      "name": "Juan"
    , "age":  51
    }
  ]
}
```

##### HTML

```html
<dl>



  <dt>Timothy</dt>
  <dd>15</dd>



  <dt>Juan</dt>
  <dd>51</dd>

</dl>
```

### `<%_` "Whitespace Slurping" Scriptlet

This tag is the same as a Scriptlet, except that it removes all whitespace before it.

#### Example

##### EJS

```ejs
<ul>
  <% users.forEach(function(user, i, arr){ -%>
    <li><%= user %></li>
  <% }); -%>
</ul>

<ul>
  <%_ users.forEach(function(user, i, arr){ -%>
    <li><%= user %></li>
  <%_ }); -%>
</ul>
```

##### HTML

```html
<ul>
      <li>Anne</li>
      <li>Bob</li>
  </ul>

<ul>
    <li>Anne</li>
    <li>Bob</li>
</ul>
```

Ending tags
-----------

There are three flavors of ending tags: the regular one, the
newline-trimming one, and the whitespace-slurping one.

### `%>`: Regular ending tag

As used in all of the examples above, `%>` is the standard tag used to end an
EJS expression.

### `-%>`: Newline-trimming ending tag

`-%>` trims all extra newlines a scriptlet or a comment might cause. It does
not have any effect on output tags.

#### Example

##### EJS

```ejs
Beginning of template
<%  'this is a statement'
 + ' that is long'
 + ' and long'
 + ' and long' %>
End of template
---
Beginning of template
<%  'this is a statement'
 + ' that is long'
 + ' and long'
 + ' and long' -%>
End of template
```

##### Output

```html
Beginning of template

End of template
---
Beginning of template
End of template
```

### `_%>`: Whitespace-slurping ending tag

`_%>` removes all whitespace after it.

Literal tags
------------

To output literal `<%` or `%>`, use `<%%` or `%%>`, respectively. If a customized delimiter is used, use
the same syntax. E.g. use `<$$` to get `<$` if the delimiter is `$`.

In regards to all the other tags, the literal tags are special as they do not
need a closing tag to function.

However, think twice before you use these tags because `<` and `>` characters might
need to be escaped as `&lt;` and `&gt;`, respectively.

#### Example

The following example wrap `<%` and `%>` in a `<pre>`, where it is not necessary to
escape `<` or `>` at all.

##### EJS

```ejs
<pre>This is literal: <%%</pre>
<pre>This is literal too: <%% %></pre>
<pre>This is literal as well: %%></pre>
```

##### HTML

```html
<pre>This is literal: <%</pre>
<pre>This is literal too: <% %></pre>
<pre>This is literal as well: %></pre>
```

## Including other files

EJS offer two ways of including other files. You can even include files that
are not EJS templates, as the case is for CSS stylesheets.

For both flavors, if the file specified does not have an extension, `.ejs` is
automatically appended. If it is an absolute path, that file is included.
Otherwise, the file is assumed to be in the same directory as the parent
template.

The behavior of resolving included file path can be overridden using the
`ejs.resolveInclude` function.


#### Whitespace control

You most probably should not use the `-%>` ending tag on an `include`
directive, as it trims the whitespace after the included file.

#### Example

##### included.ejs

```ejs
<li><%= pet.name %></li>
```

##### main.ejs

```ejs
<ul>
<% pets.forEach(function (pet) { -%>
  <% include included %>
<% }) -%>
</ul>
```

##### Locals

```json
{
  "pets": [
    {
      "name": "Hazel"
    }
  , {
      "name": "Crystal"
    }
  , {
      "name": "Catcher"
    }
  ]
}
```

##### “Preprocessor" output

```ejs
<ul>
<% pets.forEach(function (pet) { -%>
  <li><%= pet.name %></li>
<% }) -%>
</ul>
```

##### HTML

```html
<ul>
  <li>Hazel</li>
  <li>Crystal</li>
  <li>Catcher</li>
</ul>
```

### JavaScript `include()` function

With the release of EJS version 2, we have added a new way of including files
that is more intuitive. The `include()` function is available to the
templates, with the following signature:

```js
include(filename, [locals])
```

One major difference with the method described above is that the variables in
the parent function are not visible to the child template, unless it is
explicitly declared in the `locals` object, or is passed as a local to the
parent template.

Also, the included file is compiled upon execution of the script, which means
performance might be theoretically lower than the “preprocessor” flavor. In
practice however, caching can make this difference negligible.

Some cautions **MUST** to be taken if the included filename is fetched from a
user during rendering time, as one could easily use private files as the file
name, like `/etc/passwd` or `../api-keys`.

#### Example

This has the exact same effect as the example for the `include` directive.

##### included.ejs

```ejs
<li><%= pet.name %></li>
```

##### main.ejs

```ejs
<ul>
<%  pets.forEach(function (pet) { -%>
  <%- include('included', {
        pet: pet
      }) %>
<%  }) -%>
</ul>
```

##### Locals

```json
{
  "pets": [
    {
      "name": "Hazel"
    }
  , {
      "name": "Crystal"
    }
  , {
      "name": "Catcher"
    }
  ]
}
```

##### HTML

```html
<ul>
  <li>Hazel</li>
  <li>Crystal</li>
  <li>Catcher</li>
</ul>
```

## Copyright

This document is under the following license:

Copyright © 2015 Tiancheng “Timothy” Gu

Licensed under the Apache License, Version 2.0 (the “License”); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an “AS IS” BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
