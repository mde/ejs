Geddy uses the [Model](http://github.com/mde/model) module for its model layer. Model is an abstract ORM that is compatible with many different types of databases, including Postgres, in-memory, MongoDB and Riak.

* * *

#### summary
Model uses a pretty simple syntax for defining a model. (It should look familiar to anyone who has used an ORM like ActiveRecord, DataMapper, Django's models, or SQLAlchemy.)

* * *

#### .defineProperties
`defineProperties(properties)`

defines the properties for your model.

##### properties
- `properties [object]`: an object keyed by name of properties to define

##### example
```
var User = function () {
  this.defineProperties({
    login: {type: 'string', required: true}
  , password: {type: 'string', required: true}
  , lastName: {type: 'string'}
  , firstName: {type: 'string'}
  });
}
```

* * *

#### .property
`property(name, type, options)`

defines a single property

##### name
- `name [string]`: the name of the property

##### type
- `type [string]`: the type of the property
	- `’string’`
	- `’text’`
	- `’number’`
	- `’int’`
	- `’boolean’`
	- `’object’`
	- `’array’`
	- `’datetime’`
	- `’date’`
	- `’time’`

##### options
- `required [boolean]`: sets the property to be required

##### examples
```
this.property('login', 'string', {required: true});
this.property('password', 'string', {required: true});
this.property(‘joined’, ‘datetime);
this.property(‘premium’, ’boolean);
```

* * *

#### .validatesPresent
`validatesPresent(property)`

Sets up a validation to make sure that the property is present.

##### property
- `property [string]`: the name of the property to validate

##### example
```
this.validatesPresent('login');
// makes sure that the login property is present
```

* * *

#### .validatesFormat
`validatesFormat(property, regex, options)`

Sets up a validation to make sure that the property is formatted correctly.

##### property
- `property [string]`: the name of the property to validate

##### regex
- `regex [regex]`: a regular expression that the property value must pass

##### options
- `message [string]`: a message to give the use if the validation fails

##### example
```
this.validatesFormat('login', /[a-z]+/, {message: ‘cannot contain numbers’});
// makes sure that the login property does not contain numbers
```

* * *

#### .validatesLength
`validatesLength(property, options)`

Sets up a validation to make sure that the property meets certain lenght requirements.

##### property
- `property [string]`: the name of the property to validate

##### options
- `min [number]`: the minimum length of the property
- `max [number]`: the maximum length of the property

##### example
```
this.validatesLength(‘login', {min: ‘3’});
// makes sure that the login property is at least 3 characters long


this.validatesLength(‘login', {min: ‘20’});
// makes sure that the login property is not longer than 20 characters
```

* * *

#### .validatesConfirmed
`validatesConfirmed(property, param)`

Sets up a validation to make sure that the property has been confirmed.

##### property
- `property [string]`: the name of the property to validate

##### param
- `param [string]`: the param required to match

##### example
```
this.validatesConfirmed('password', 'confirmPassword');
// confirms that password and confirmPassword are equal
```

* * *

#### .validatesWithFunction
`validatesWithFunction(property, fn)`

Sets up a validation to make sure that the property has been confirmed.

##### property
- `property [string]`: the name of the property to validate

##### fn
- `fn [function]`: a function which, when passed the value of the property, will return true or false

##### example
```
this.validatesWithFunction('password', function (val) {
      // Something that returns true or false
      return val.length > 0;
});
// uses the function to see if th length of password is greater than 0
```

* * *

#### .hasOne
`hasOne(model)`

Sets up a has one relationship between this model and another.

##### model
- `model [string]`: the name of the model that this model has one of.

##### example
```
this.hasOne('Profile');
// sets up a has one relationship
// user -> has one -> profile
```

* * *

#### .hasMany
`hasMany(model)`

Sets up a has many relationship between this model and another.

##### model
- `model [string]`: the pluralized name of the model that this model has many of.

##### example
```
this.hasMany(‘Friends’);
// sets up a has many relationship
// user -> has many -> friends
```

* * *

#### .adapter
`this.adapter`

Defines the database adapter for this model

##### examples
```
this.adapter = ‘mongo’;
// makes this model use mongo for it’s database


this.adapter = ‘riak’


this.adapter = ‘postgres’


this.adapter = ‘memory’
```

* * *

#### instance

Instance methods can be defined in the model definition as well.

##### example
```
var User = function () {
...
  this.someMethod = function () {
    // Do some stuff
  };
  // sets up a someMethod method on each instance of this model
...
};
```

* * *

#### .isValid
`isValid()`

Returns true if the model instance passes all validations, otherwise it returns false.

##### example
```
user.isValid()
```

* * *

#### .save
`save(fn)`

Saves the instance to the database.

##### fn
- `fn [function]`: the function to be called when saving is complete

##### example
```
user.save(function (err, data) {
// do things
});
// saves the user then calls the callback function
```

* * *

#### .updateProperties
`updateProperties(properties)`

Updates the properties of a model and asserts that they are valid; This method will not call save on the instance.

##### properties
- `properties [object]`: an object who’s keys are property names and its values are the values to change the property to.

##### example
```
user.updateProperties({
  login: 'alerxst'
});
// updates the login property and validates it
```

* * *

#### static

docs coming soon

* * *

#### .create
`create(params)`

Creates a new model instance and returns it.

##### params
- `params [object]`: an object whos keys are model properties

##### example
```
var params = {
  login: 'alex'
, password: 'lerxst'
, lastName: 'Lifeson'
, firstName: 'Alex'
};
var user = User.create(params);
```

* * *

#### .first
`first(query, options, fn)`

Use the `first` method to find a single item. You can pass it an id, or a set of query parameters in the form of an object-literal. In the case of a query, it will return the first item that matches, according to whatever sort you've specified.

##### query [string]
- `query [string]`: if the query is a string, it will be assumed that it’s an id

##### query [object]
- `query [object]`: if the query is an object, it will be interpreted as a Query object

##### example
```
User.first(‘sdfs-asd-1’, function (err, user) {
  // do stuff with user
});


User.first({login: 'alerxst'}, function (err, user) {
  // do stuff with user
});
```

* * *

#### .all
`all(query, options, fn)`

Use the `all` method to find lots of items. Pass it a set of query parameters in the form of an object-literal, where each key is a field to compare, and the value is either a simple value for comparison (equal to), or another object-literal where the key is the comparison-operator, and the value is the value to use for the comparison.

##### query [object]
- `query [object]`: if the query is an object, it will be interpreted as a Query object

##### options
- `sort [object]`: each key is a property name, each value can either be `asc` or `desc`

##### example
```
User.all({location: ‘san francisco’}, function (err, users) {
  // do stuff with users
});


User.all({location: ‘san francisco’}, {sort: {createdAt: ‘desc’}}, function (err, users) {
  // do stuff with users
});
```

* * *

#### .remove
`remove(id, fn)`

Remove an instance from the database by id.

##### id
- `id [string]`: the id of the instance to be removed

##### examples
```
User.remove(‘abc-123’, function (err, data) {
  // do something now that it’s removed.
});
```

* * *

#### queries

docs coming soon

* * *

#### events

Both the base model 'constructors,' and model instances are EventEmitters. The
emit events during the create/update/remove lifecycle of model instances. In all
cases, the plain-named event is fired after the event in question, and the
'before'-prefixed event, of course happens before.

The 'constructor' for a model emits the following events:

 - beforeCreate
 - create
 - beforeValidate
 - validate
 - beforeUpdateProperties
 - updateProperties
 - beforeSave (new instances, single and bulk)
 - save (new instances, single and bulk)
 - beforeUpdate (existing single instances, bulk updates)
 - update (existing single instances, bulk updates)
 - beforeRemove
 - remove

Model-item instances emit these events:

 - beforeUpdateProperties
 - updateProperties
 - beforeSave
 - save
 - beforeUpdate
 - update

* * *
