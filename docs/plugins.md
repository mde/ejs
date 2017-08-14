EJS Plug-in Reference
==============================

Ejs offers support for plug-ins.

The following describes the methods that a plug-in may overwrite.


Table of contents
-----------------

- Subclassing the Ejs Template class
- Naming and avoiding Conflicts
- Understanding the compiled template
- Methods that may be overwritten
  - Constructor
  - compile
  - generateArgumentNames
  - generateArguments
  - scanTextLine
  - scanTagLine
  - getModeMap

Subclassing the Ejs Template class
----------------------------------

Ejs exports the class for template handling as `ejs.Template`

This class is used by all ejs functions, such as render, renderFile, but also
to handle includes.

A plug-in will create an inherited class, and replace the original.

```
var ejs = require('ejs');
function SnippetClass(text, opts) { /* ... */ }
SnippetClass.prototype = Object.create(ejs.Template.prototype);
ejs.Template = SnippetClass;
```

A plug-in must not assume that ejs.Template will keep the new value.
Other plug-ins may replace this with their own class. If so the 
plug-in will be somewhere in the inheritance chain.

Naming and avoiding Conflicts
-----------------------------

Snippets must ensure that any function/key they add to the Template class
(or an instance of it) do not conflict with ejs own keys.

The only save way to do so, is to prefix all function/keys with `__pluginXXX`
where XXX is the name of the plug-in.
This should also avoid conflicts with other plug-in.


Understanding the compiled template
-----------------------------------

Ejs compiles each template into a function.

The body includes all the html, and any javascript from any <% <%= ... tag.

In order for the user's javascript to see the locals object, and functions
like include(), the generated function takes those as arguments.

`function (locals, include, ...)`

If opts.client is set then all but the locals argument are optional. In
this case a variable for "include" will be declared inside the function.

If opts.client is not set, then the generated function is wrapped before
being returned by compile(). And "include" is passed in by the wrapper.

If opts.client is not set, plug-ins can add their own wrappers.


Methods that may be overwritten
-------------------------------

If not otherwise specified, the inherited call should be made using `arguments`.
This will ensure continued functionality, if ejs extends the argument list of
any method.

Plug-in must obey `opts.client`

```
var ejs = require('ejs');
var EjsTemplate = ejs.Template;
//....
function XXX () {
  EjsTemplate.prototype.XXX.apply(this, arguments);
```

### Constructor

`function Template(text, opts) {}`

Initialize your plug-in as needed.

To access opts, first call the inherited constructor and then access this.opts.

### compile

`compile: function () {}`

Returns a function representing the template. The returned function
can be called `f(local)` to get the result of a template.

Plug-in must obey `this.opts.client` in which case they are *not* allowed
to replace this function.
A plug-in may decide to do nothing, if this.opts.client is set.

#### Replacing the returned function

If this.opts.client is *not* set, then templates may replace (wrap) the
function returned by compile.

The wrapper function has the signature `function (locals, callerFnArgs)` and
returns the rendered template as text.

##### locals

A plug-in may change the values for locals.

##### callerFnArgs

Please also see `generateArguments()`.

This value is set, if the function was called by an include() statement.

It contains the value that `generateArguments()` returned for the calling
the compiled-template-function.

Within the wrapper returned by compile, "callerFnArgs" is passed to 
generateArguments() to get the arguments for calling the 
compiled-template-function.

A plug-in can use this to pass additinal data to the wrapper function 
(and generateArguments) of an included template (or any template somehow
used by the main template).

```
function compile() {
  // get the wrapper
  var fn = EjsTemplate.prototype.compile.apply(this, arguments);
  
  // return a new wrapper
  var newFn = function (data, callerFnArgs) {
    // callerFnArgs may be undefined, or have the values of the template
    // that is including this template.
    return fn.apply(self, arguments);
  };
  newFn.dependencies = fn.dependencies; // Always include this.
  return newFn;
}
```

A plug-in can set values to callerFnArgs in its wrapper. Those will then be
available to generateArguments.

A plug-in can also add those values in generateArguments.

A plug-in can also create a closure in its wrapper, that has access to
callerFnArgs. If this closure is called *after* the call to generateArguments
then the closure will see any modifications made by generateArguments.

This way a wrapper can define its own extended include

```
var newFn = function (data, callerFnArgs) {
    // if this is the main template callerFnArgs is not defined yet
    callerFnArgs = callerFnArgs || {}; 
    callerFnArgs.myInclude = function(...) {
      // do something
      callerFnArgs.include(...);
    };
    return fn.apply(self, arguments); //will add include() to callerFnArgs
  };
}
```


### generateArgumentNames

`function (opts) {}`

Returns the ordered list of names for the arguments of the 
compiled-template-function.

See "Understanding the compiled template"

The list includes; "locals" (or opts.localsName), "include", and some
internally used arguments.

If your plug-in want to make a value or function available to the 
javascript in the template, the add the name here.

To make a value/function named FOO available:

```
var r = EjsTemplate.prototype.generateArgumentNames.apply(this, arguments);
return r.concat(['FOO']);
```

If your plug-in does choose do to nothing if opts.client is set, then it
should only add names, if opts.client is not set.

### generateArguments

`function (data, opts, ejsArgs, callerFnArgs) {}`

Returns an object, with a key for each argument (See generateArgumentNames).

A typicall value would be:

```
{
  locals: {},        // name of the key may change according to opts.localsName
  include: function, // function for the include argument
  escapeFn: function, // html escape
  rethrow: function,  // internal
}
```

- data: the locals object
- opts: this.opts
- ejsArgs: internal
- callerFnArgs: See compile()

If values should be passed from the main template to included templates, then
they can be copied from callerFnArgs to the result.

### scanTextLine

`function (line, prevCloseTag, nextOpenTag) {}`

This function is called for the text-parts of the template. (that is anything
that is not in any <% %> tags / e.g. the html parts).

If there was a <% %> before this text-part, then the modifier of the closing
tag is in prevCloseTag.

- If there was a plain %> then prevCloseTag = ''
- If there was a -%> then prevCloseTag = '-'

If the text-part is followed by any <% then nextOpenTag contains the modifier.
This may be '' (empty) or _-=# (See also getModeMap)

prevCloseTag and nextOpenTag can for example be used for trimming text.

#### Dealing with "line" content

If a plug-in handle the "line" text, then it may decide not to call the 
parent method.

If the plug-in needs to add anything to the source of the 
compiled-template-function then it must use the following methods

##### this._srcAppend(text)

Adds the text to the output of the template-result.

"text" must be a javascript expression that returns a value.
It must not end with a ";". It also must not contain end of line comments (//).

The plug-in can add code around the text. For example
`this._srcAppend('escapeFn(' + line + ')');`

This is used by `<%= foo %>`

##### this._srcAdd(code)

Adds javascript to the source. This generates no output to the result of the
template. This is for control flow.

This is used by `<% if ... %>`


### scanTagLine

`function (openTag, line, closeTag) {}`

This function is called for the javascript-parts of the template.

openTag and closeTag are the modifiers of the surrounding <% %>.

openTag can be  '' (empty) or _-=# (See also getModeMap).

closeTag can be '' or '-'

See "Dealing with "line" content".

### getModeMap

This function defines the modifiers allowed with opening tags. "<%x"

Modifiers must be a single char.
Modifiers can not be equal to the delimiter.

The default is:

```
{
      '':  exports.modes.EVAL,
      '=': exports.modes.ESCAPED,
      '-': exports.modes.RAW,
      '_': exports.modes.EVAL,
      '#': exports.modes.COMMENT,
    };
```

If a plug-in wants to add a value, it must check that it does not yet exists.
It must also add a key to `exports.modes`

```
exports.modes = {
  EVAL: 'eval',
  ESCAPED: 'escaped',
  RAW: 'raw',
  COMMENT: 'comment',
};
```

The value for the key must be unique.

Modifiers will be passed to scanTagLine and scanTextLine.
