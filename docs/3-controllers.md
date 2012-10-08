Controllers define the different actions that your users can interact with.

* * *

#### .request
docs coming soon

* * *

#### .respnose
docs coming soon

* * *

#### .params
docs coming soon

* * *

#### .cookies
docs coming soon

* * *

#### .name
docs coming soon

* * *

#### .respondsWith
docs coming soon

* * *

#### .content
docs coming soon

* * *

#### .before
`before(filter, [options])`

Adds an action to be performed before a response is rendered.

##### filter
- `filter [function]` Action to add to the afterFilter list.

##### options
- `except [array]` List of actions where the before-filter should not be performed.
- `only [array]` List of actions where the before-filter should only be performed.

##### examples
```
this.before(someFunction);
// runs someFunction before the response is rendered


this.before(someFunction, {except: [‘index’, ‘home’]});
// won’t run someFunction if this is the index or home action


this.before(someFunction, {only: [‘add’, ‘update’, ‘remove’]}
// will only run someFunction if this is the add, update, or remove action
```

* * *

#### .after
`after(filter, [options])`

Adds an action to be performed after a response is rendered.

##### filter
- `filter [function]` Action to be performed

##### options
- `except [array]` List of actions where the after-filter should not be performed.
- `only [array]` List of actions where the after-filter should only be performed.

##### examples
```
this.after(someFunction);
// runs someFunction after the response is rendered


this.after(someFunction, {except: [‘index’, ‘home’]});
// won’t run someFunction if this is the index or home action


this.after(someFunction, {only: [‘add’, ‘update’, ‘remove’]}
// will only run someFunction if this is the add, update, or remove action
```

* * *

#### .protectFromForgery
docs coming soon

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
this.redirect(‘/users/1’);
// will redirect the browser to /users/1


this.redirect({controller: ‘users’, action: ‘show’, id: 1});
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
docs coming soon

* * *

#### .respond
docs coming soon

* * *

#### .renderTemplate
docs coming soon

* * *