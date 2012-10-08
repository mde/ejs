Controllers define the different actions that your users can interact with. Every controller has these methods:
#### .request
docs coming soon
#### .respnose
docs coming soon
#### .params
docs coming soon
#### .cookies
docs coming soon
#### .name
docs coming soon
#### .respondsWith
docs coming soon
#### .content
docs coming soon
#### .before
docs coming soon

#### .after
`after(filter, [options])`

Adds an action to the afterFilters list of actions to be performed after a response is rendered.

##### filter
- `filter [function]` Action to add to the afterFilter list.

##### options
- `except [array]` List of actions where the before-filter should not be performed.
- `only [array]` List of actions where the before-filter should only be performed.

#### examples
```
this.after(someFunction);
// runs someFunction after the response is rendered


this.after(someFunction, {except: [‘index’, ‘home’]});
// won’t run someFunction if this is the index or home action


this.after(someFunction, {only: [‘add’, ‘update’, ‘remove’]}
// will only run someFunction if this is the add, update, or remove action
```



#### .protectFromForgery
docs coming soon
#### .redirect
docs coming soon
#### .error
docs coming soon
#### .transfer
docs coming soon
#### .respond
docs coming soon
#### .renderTemplate
docs coming soon
