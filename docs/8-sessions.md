Sessions are used to keep track of current connections to the server.

#### .get
`get( key )`

Gets a key from the current session.

##### key
- `key [string]`: the key to return the value of

##### example
```
var user = this.session.get(‘user’);
```

#### .set
`set( key, value )`

Saves a value to the current session as a key

##### key
- `key [string]`: the key to set on the session

##### value
- `value [object]`: the value to save to the session

##### example
```
this.session.set(‘user’, user);
```

#### .unset
`unset( key )`

Removes a key and value from the current session

##### key
- `key [string]`: the key to remove

##### example
```
this.session.unset(‘user’);
```

#### .isExpired
```
isExpired()
```

Returns true if the current session has expired

##### example
```
this.session.isExpired
```

#### .flashBag.add
`flashBag.add(message, type)`

Adds a flash message to the session's flashbag

##### message
- `message [string]`: the message to add

##### type
- `type [string]`: (default="info") the message type, can be one of "info","error","success" or anything else

##### example
```
this.session.flashBag.add(’foo has a bar’,’success’);
```

### .flashBag.get
`flashBag.get( type )`

Retrieves all flash message of a type. This will also empty the flashbag of those messages.

#### type
- `type [string]`: the message type, can be one of "info","error","success" or anything else

##### example
```
this.session.flashBag.get(’success’);
```

### .flashBag.has
`flashBag.has()`

Checks if the flashbag has any messages.

##### example
```
this.session.flashBag.has();
```