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

#### .reset
```
reset()
```

Completely resets the user's session -- wipes all data, sets a new session ID.

##### example
```
this.session.reset
```
