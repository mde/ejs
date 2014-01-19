Controllers define the different actions that your users can interact with.

* * *

#### .request
`this.request`

The raw `http.ServerRequest` object for this request/response cycle.

* * *

#### .response
`this.response`

The raw `http.ServerResponse` object for this request/response cycle.

* * *

#### .params
`this.params`

The parsed params for the request. `params` is also passed as an argument to the action, it was added as an instance field for convenience.

* * *

#### .cookies
`this.cookies`

Cookies collection from the request

* * *

#### .name
`this.name`

The name of the controller constructor function, in CamelCase with uppercase initial letter.

* * *

#### .canRespondTo
`canRespondTo(contentTypes)`

Content-types the controller can use in responses.

##### contentTypes
- `contentTypes [array]` The list of content-types the controller can use for responding.

##### example
```
this.canRespondTo(['html', 'json', 'js']);
```

* * *

#### .before
`before(filter, [options])`

Adds an action to be performed before a response is rendered.

##### filter
- `filter [function]` Action to add to the beforeFilter list. If the action is
asynchronous, takes a single callback parameter to call when the action is
finished.

##### options
- `except [array]` List of actions where the before-filter should not be performed.
- `only [array]` List of actions where the before-filter should only be performed.
- `async` [boolean] When set to true, the before-filter is asynchronous, and requires a callback

##### examples
```
this.before(function () { // Do something });
// runs the function before the action is run

this.before(someFunction, {except: ['index', 'home']});
// won't run someFunction if this is the index or home action

this.before(someFunction, {only: ['add', 'update', 'remove']}
// will only run someFunction if this is the add, update, or remove action

this.before(function (next) {
  doSomethingAsync(function (err, result) {
    next();
  });
}, {async: true});
// runs an async function before the action -- requires a callback to proceed
```

* * *

#### .after
`after(filter, [options])`

Adds an action to be performed after a response is rendered.

##### filter
- `filter [function]` Action to add to the afterFilter list. If the action is
asynchronous, takes a single callback parameter to call when the action is
finished.

##### options
- `except [array]` List of actions where the after-filter should not be performed.
- `only [array]` List of actions where the after-filter should only be performed.
- `async` [boolean] When set to true, the after-filter is asynchronous, and requires a callback

##### examples
```
this.after(function () { // Do something });
// runs the function after the action is run, but before the response is completed

this.after(someFunction, {except: ['index', 'home']});
// won't run someFunction if this is the index or home action

this.after(someFunction, {only: ['add', 'update', 'remove']}
// will only run someFunction if this is the add, update, or remove action

this.after(function (next) {
  doSomethingAsync(function (err, result) {
    next();
  });
}, {async: true});
// runs an async function after the action -- requires a callback to proceed
```

* * *

#### .protectFromForgery
`protectFromForgery()`

Prevents cross-site requests by requiring a same-origin token for destructive
HTTP methods (PUT, POST, DELETE)

* * *

#### .redirect
`redirect(to, options)`

##### to [string]
- if `to` is a string, it will redirect to the url in that string

##### to [object]
- `controller [string]`: a controller name
- `action [string]`: an action name
- `format [string]`: the file extension

##### options
- `statusCode [number]` Override for default 302 HTTP status-code. Must be valid
3xx status code (e.g., 301 / moved permanently, 301 / temporary redirect)

Sends a (302) redirect to the client, based on either a simple string-URL, or a
controller/action/format combination.

##### examples
```
this.redirect('/users/1');
// will redirect the browser to /users/1

this.redirect({controller: 'users', action: 'show', id: 1});
// will redirect the browser to /users/1
```

* * *

#### .error
`error(err)`

Respond to a request with an appropriate HTTP error-code. If a status-code is
set on the error object, uses that as the error's status-code. Otherwise,
responds with a 500 for the status-code.

##### err [error]
- `statusCode [number]` optional HTTP status code to send to the client, defaults to 500
- `message [string]` the error message text to send to the client

##### examples
```
this.error();
// sends a 500

var err = new Error('Whoopsy daisy');
this.error(err);
// sends a 500 with a specific message

var err = new Error();
err.statusCode = 420;
this.error(err);
// sends a 420
```

* * *

#### .transfer
```
transfer(action)
```

Transfer a request from its original action to a new one. The entire request
cycle is repeated, including before-filters.

##### action
- `action [string]`: name of the new action designated to handle the request.
- `action [object]`: The new action designated to handle the request.

* * *

#### .respondWith
```
respondWith(resources)
```

Uses a format-specific strategy to provide a response using the resource
provided. In the case of an HTML response, it might render a template, or do a
redirect -- with JSON, it will output the appropriate API-style JSON response.

A good example is a CRUD `create` action. If the client requests an HTML
response, `respondWith` will render an HTML template, and return it with a
200/OK status-code. If the client requests a JSON response, it will output a
JSON-formatted response with a 201/Created status-code, and a 'Location' header
with the URL for the created item.

In order to use `respondWith`, you need to declare the formats your controller
will support using `canRespondTo`.

##### resources
- `resources [object]`: a Geddy model instance or a collection of instances to
use in the response.

##### examples
```
// Fetch a user and respond with an appropriate response-strategy
var self = this;
geddy.model.User.first({username: 'foo'}, function (err, user) {
  self.respondWith(user);
});

```

* * *

#### .respondTo
```
respondTo(strategies)
```
Allows you to provide specific response-strategies to use for a particular
request.

NOTE: when you use `respondTo`, it overrides any formats declared to be
supported on the controller using `canRespondTo`.

##### strategies
- `strategies [object]`: Format-specific strategies for outputting a response.

##### examples
```
// Fetch a user and respond with an appropriate response-strategy
var self = this;
geddy.model.User.first({username: 'foo'}, function (err, user) {
  self.respondTo({
    html: function () {
      self.redirect('/user/profiles?user_id=' + user.id);
    }
  , json: function () {
      self.respond(user, {format: 'json'});
    }
  });
});

```

* * *

#### .respond
```
respond(data, options)
```

Performs content-negotiation, and renders a response.

##### data
- `data [object]`: an object with properties to send to the view

##### options
- `layout [string]`: the path to the layout file to use
- `layout [false]`: a flag to not use a layout file
- `format [string]`: the format to render
- `template [string]`: The path (without file extensions) to the template to use to render this response
- `statusCode [number]`: The HTTP status-code to use with this response

##### examples
```
this.respond(params);
// send the params object to the view, then send the response


this.respond({posts: posts});
// send the passed in object to the view, then send the response


this.respond(params, {template: 'path/to/template'});
// send params to path/to/template, render it, then send the response


this.respond(params, {format: 'json'});
// send the params object as the response in json format

this.respond(null, {statusCode: 201});
// send a 201/created with no body
```

* * *

#### .output
```
output(statusCode, headers, content)
```

Outputs a response with a specific HTTP response-code, HTTP headers, and
content. This is the lowest-level response API, for when you know exactly the
status, headers, and content you want to output.

##### statusCode
- `statusCode [number]`: HTTP status-code to be use for the response

##### headers
- `headers [object]`: HTTP headers to include in the response

##### content
- `content [string]`: Content to be used in the response-body (optional).
If not passed, no response body is output.

##### examples
```
this.output(200, {'Content-Type': 'application/json'},
    '{"foo": "bar"}');
// Output a JSON response

this.output(201, {'Content-Type': 'text/html',
    'Location': '/foobars/12345'});
```

* * *

#### .cacheResponse
`this.cacheResponse(actions)`

Cache the response for a particular action on this controller.

##### actions
- `actions [string|array]`: Action or actions for the controller to cache
responses for.

##### examples
```
// Cache the response for the 'index' action
this.cacheResponse('index');

// Cache responses for the the 'main' and 'feed' actions
this.cacheResponse(['main', 'feed']);
```

* * *

#### .flash

The flash is a special part of the session which is cleared with each request.
This means that values stored there will only be available in the next request.
This is useful for storing error messages, etc. It is accessed in much the same
way as the session, like a hash.

It also includes a few convenience methods for getting/setting commonly used
types of flash-messages.

* * *

#### .flash.alert
```
flash.alert([message])
```

Gets or sets the *alert* flash-messages for a session. If the 'message' (value)
parameter is included it sets the value. If the 'message' paramter is not
included, it retrieves the value and returns it.

##### message
- `message [string|object]`: The contents of the flash-message

##### examples
```
this.flash.alert('Check it out!');
// Sets the 'alert' flash-message to 'Check it out!'

this.flash.alert();
// Returns 'Check it out!'
```

* * *

#### .flash.error
```
flash.error([message])
```

Gets or sets the *error* flash-messages for a session. If the 'message' (value)
parameter is included it sets the value. If the 'message' paramter is not
included, it retrieves the value and returns it.

##### message
- `message [string|object]`: The contents of the flash-message

##### examples
```
this.flash.error('Yikes! Something wrong wrong.');
// Sets the 'error' flash-message to 'Yikes! Something wrong wrong.'

this.flash.error();
// Returns 'Yikes! Something wrong wrong.'
```

* * *

#### .flash.success
```
flash.success([message])
```

Gets or sets the *success* flash-messages for a session. If the 'message' (value)
parameter is included it sets the value. If the 'message' paramter is not
included, it retrieves the value and returns it.

##### message
- `message [string|object]`: The contents of the flash-message

##### examples
```
this.flash.success('Whoa! It worked.');
// Sets the 'success' flash-message to 'Whoa! It worked.'

this.flash.success();
// Returns 'Whoa! It worked.'
```

* * *

#### .flash.info
```
flash.info([message])
```

Gets or sets the *info* flash-messages for a session. If the 'message' (value)
parameter is included it sets the value. If the 'message' paramter is not
included, it retrieves the value and returns it.

##### message
- `message [string|object]`: The contents of the flash-message

##### examples
```
this.flash.info('FYI. Just sayin.');
// Sets the 'info' flash-message to 'FYI. Just sayin.'

this.flash.info();
// Returns 'FYI. Just sayin.'
```

* * *

#### .flash.set
```
flash.set([type], message)
```

Sets the flash-messages for a session, for a custom type, or the entire
flash-message object

##### type
- `type [string]`: The flash-message type. If not included, this call sets
the entire flash-message object

##### message
- `message [string|object]`: The contents of the flash-message

##### examples
```
this.flash.set('foo', 'Foo bar baz');
// Sets the 'foo' flash-message to 'Foo bar baz'

this.flash.set({bar: 'Baz bar qux});
// Sets the entire flash-message object
```

* * *

#### .flash.get
```
flash.get([type])
```

Retrieves the flash-messages for a session, for a custom type, or the entire
flash-message object

##### type
- `type [string]`: The flash-message type. If not included, this call
retrieves the entire flash-message object

##### examples
```
this.flash.set('foo', 'Foo bar baz');
this.flash.get('foo');
// Returns 'Foo bar baz'

this.flash.get();
// Returns an object: {foo: 'Foo bar baz'}
```

* * *

#### .flash.keep
```
flash.keep([type])
```

Normally flash-message are wiped out when they are used in the current request.
`keep` makes them persist and be available to the next request.

##### type
- `type [string]`: The type of message to preserve until the next request.
If the type param is not included, preserves the entire flash-message object

##### examples
```
this.flash.keep('error');
// Keep the error flash around after a redirect
```

* * *

#### .flash.discard
```
flash.discard([type])
```

Mark a particular flash-message entry (or the entire object) to be discarded at
the end of the current request.

##### type
- `type [string]`: The type of message to discard at the end of the current request.
If the type param is not included, discards the entire flash-message object

##### examples
```
this.flash.discard('error');
// Discard the current error flash-message
```

* * *


