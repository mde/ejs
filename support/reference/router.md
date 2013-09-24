Geddy uses [Barista](http://github.com/kieran/barista) as its router. Its API is very similar to rails routes. Both general-purpose resource-based routes and individually defined routes are possible.

* * *

### .match
`router.match(path [, method])`

defines the url to match to a controller action.

#### path
- `path [string]`: the url to match to an action

#### method
- `method [string]`: the http method to match

#### examples
```
router.match('/').to('Main.index');
// will route any request to '/' to the Main controller's index action


router.match('/products/:id', 'GET').to('products.show')
// will route '/products/5' to Products.show()
// and set the id paramer to be 5


router.match('/profiles/:username', 'GET').to('users.show')
// will route '/products/dan' to Users.show()
// and set the username paramer to be dan


router.match('/products/:id(.:format)', 'GET').to('products.show')
// things enclosed in parentheses are optional
```

* * *

### .to
`router.match(path).to(action)`

defines the action to map the path to.

#### action
- `action [string]`: a controller name plus an action name as a string
- `action [object]`: an object that defines a controller and action property

#### examples
```
router.match('/').to('Main.index');
// will route any request to '/' to the Main controller's index action


router.match('/').to({controller: 'Main', action: 'index'});
// will route any request to '/' to the Main controller's index action
```

* * *

### .get
`router.get(path)`

Equivalent to `router.match(path, 'GET')`

* * *

### .post
`router.post(path)`

Equivalent to `router.match(path, 'POST')`

* * *

### .put
`router.put(path)`

Equivalent to `router.match(path, 'PUT')`

* * *

### .del
`router.del(path)`

Equivalent to `router.match(path, 'DELETE')`

* * *

### .resource
`router.resource(controller)`

generates standard resource routes for a controller name

#### controller
- `controller [string]`: the camelCased controller name that needs resourceful routes

#### examples
```
router.resource('products')

// is equivalent to:

router.get('/products(.:format)').to('products.index')
router.get('/products/add(.:format)').to('products.add')
router.get('/products/:id(.:format)').to('products.show')
router.get('/products/:id/edit(.:format)').to('products.edit')
router.post('/products(.:format)').to('products.create')
router.put('/products/:id(.:format)').to('products.update')
router.del('/products/:id(.:format)').to('products.destroy')
```

* * *
