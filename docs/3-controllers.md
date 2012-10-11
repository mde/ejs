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

#### .respondsWith
`this.respondsWith`

Content-type the controller can respond with.

##### example
```
this.respondsWith = ['txt','json','html'];
```

* * *

#### .before
`before(filter, [options])`

Adds an action to be performed before a response is rendered.

##### filter
- `filter [function]` Action to add to the beforeFilter list. If the action is asynchronous, takes a single callback parameter to call when the action is finished.

##### options
- `except [array]` List of actions where the before-filter should not be performed.
- `only [array]` List of actions where the before-filter should only be performed.
- `async` [boolean] When set to true, the before-filter is asynchronous, and requires a callback

##### examples
```
this.before(someFunction);
// runs someFunction before the response is rendered


this.before(someFunction, {except: ['index', 'home']});
// won't run someFunction if this is the index or home action


this.before(someFunction, {only: ['add', 'update', 'remove']}
// will only run someFunction if this is the add, update, or remove action
```

* * *

#### .after
`after(filter, [options])`

Adds an action to be performed after a response is rendered.

##### filter
- `filter [function]` Action to add to the afterFilter list. If the action is asynchronous, takes a single callback parameter to call when the action is finished.

##### options
- `except [array]` List of actions where the after-filter should not be performed.
- `only [array]` List of actions where the after-filter should only be performed.
- `async` [boolean] When set to true, the before-filter is asynchronous, and requires a callback

##### examples
```
this.after(someFunction);
// runs someFunction after the response is rendered


this.after(someFunction, {except: ['index', 'home']});
// won't run someFunction if this is the index or home action


this.after(someFunction, {only: ['add', 'update', 'remove']}
// will only run someFunction if this is the add, update, or remove action
```

* * *

#### .protectFromForgery
`protectFromForgery()`

Prevents cross-site requests by requiring a same-origin token for destructive HTTP methods (PUT, POST, DELETE)

* * *

#### .redirect
`redirect(to)`

##### to [string]
- if `to` is a string, it will redirect to the url in that string

##### to [object]
- `controller [string]`: a controller name
- `action [string]`: an action name
- `format [string]`: the file extension

Sends a 302 redirect to the client, based on either a simple string-URL, or a controller/action/format combination.

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

Respond to a request with an appropriate HTTP error-code. If a status-code is set on the error object, uses that as the error's status-code. Otherwise, responds with a 500 for the status-code.

##### err
- `statusCode [number]` the code to send to the client
- `msg [string]` the message to send to the client

##### examples
```
this.error()
// sends a 500


this.error({statusCode: 501})
// sends a 501
```

* * *

#### .transfer
```
transfer(action)
```

Transfer a request from its original action to a new one. The entire request cycle is repeated, including before-filters.

##### action
- `action [string]`: name of the new action designated to handle the request.
- `action [object]`: The new action designated to handle the request.

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
```

* * *
