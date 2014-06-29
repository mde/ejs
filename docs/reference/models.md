Geddy uses the [Model](http://github.com/mde/model) module for its model layer.

Model is an abstract ORM that is compatible with many different types of
databases, including:

* Postgres
* MySQL
* SQLite
* Riak
* MongoDB
* LevelDB
* In-memory
* Filesystem

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
	- `'string'`
	- `'text'`
	- `'number'`
	- `'int'`
	- `'boolean'`
	- `'object'`
	- `'datetime'`
	- `'date'`
	- `'time'`

##### options
- `required [boolean]`: sets the property to be required

##### examples
```
this.property('login', 'string', {required: true});
this.property('password', 'string', {required: true});
this.property('joined', 'datetime');
this.property('premium', 'boolean');
```

* * *

#### .validatesPresent
`validatesPresent(property, options)`

Sets up a validation to make sure that the property is present.

##### property
- `property [string]`: the name of the property to validate

##### options
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesPresent('login');
// makes sure that the login property is present
```

#### .validatesAbsent
`validatesAbsent(property, options)`

Sets up a validation to make sure that the property is not present.

##### property
- `property [string]`: the name of the property to validate

##### options
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesAbsent('zerb');
// makes sure that the zerb property is not present
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
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesFormat('login', /[a-z]+/, {message: 'cannot contain numbers'});
// makes sure that the login property does not contain numbers
```

* * *

#### .validatesLength
`validatesLength(property, options)`

Sets up a validation to make sure that the property meets certain length requirements.

##### property
- `property [string]`: the name of the property to validate

##### options
- `min [number]`: the minimum length of the property
- `max [number]`: the maximum length of the property
- `is [number]:` the exact length of the property
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesLength('login', {min: 3});
// makes sure that the login property is at least 3 characters long


this.validatesLength('login', {max: 20});
// makes sure that the login property is not longer than 20 characters

this.validatesLength('login', {is: 3})
// makes sure that the login property is exactly 3 characters long
```

* * *

#### .validatesConfirmed
`validatesConfirmed(property, param, options)`

Sets up a validation to make sure that the property has been confirmed.

##### property
- `property [string]`: the name of the property to validate

##### param
- `param [string]`: the param required to match

##### options
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesConfirmed('password', 'confirmPassword');
// confirms that password and confirmPassword are equal
```

* * *

#### .validatesWithFunction
`validatesWithFunction(property, fn, options)`

Sets up a validation to make sure that the property has been confirmed.

##### property
- `property [string]`: the name of the property to validate

##### fn
- `fn [function]`: a function which will return true or false. It is passed two 
arguments: the value of the property, and an object mapping from the model instance's 
properties to the values for those properties

##### options
- `on [string|array]`: specifies when validation happens (defaults to ['create', 'update'])
- `message [string]`: a message to give the user if the validation fails

##### example
```
this.validatesWithFunction('password', function (val, params) {
      // Something that returns true or false
      return val.length > 0;
});
// uses the function to see if the length of password is greater than 0
```

* * *

#### .hasOne
`hasOne(model)`

Sets up a has-one relationship between this model and another.

##### model
- `model [string]`: the name of the model that this model has one of.

##### example
```
this.hasOne('Profile');
// sets up a has one relationship
// (something) -> has one -> profile
```

* * *

#### .hasMany
`hasMany(model)`

Sets up a has-many relationship between this model and another.

##### model
- `model [string]`: the pluralized name of the model that this model has many of.

##### example
```
this.hasMany('Friends');
// sets up a has many relationship
// (something) -> has many -> friends
```

* * *

#### .belongsTo
`belongsTo(model)`

Sets up a belongs-to relationship between this model and another. A belongs-to
is often used as the inverse of a has-many or has-one. Note however that this
is not required -- associations are unidirectional.

##### model
- `model [string]`: the singular name of the model that this model belongs to.

##### example
```
this.belongsTo('User');
// sets up a belongs-to relationship
// (something) -> belongs to -> a user
```

* * *

#### .adapter
`this.adapter`

Defines the database adapter for this model

##### examples
```
this.adapter = 'mongo';
// makes this model use mongo for it's database


this.adapter = 'riak'


this.adapter = 'postgres'


this.adapter = 'memory'
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
- `properties [object]`: an object who's keys are property names and its values are the values to change the property to.

##### example
```
user.updateProperties({
  login: 'alerxst'
});
// updates the login property and validates it
```

#### .add
`.add{target_model_name}( instance )`

If a model has a hasMany relationship established with another model, you can use this method to add instaces of one model to it’s “parent” model.

##### target_model_name
- The name of the model you’d like to add

##### instance
- `instace [modelInstance]`: The instance to add

##### example
```
var user = geddy.model.User.create(userParams);
var post = geddy.model.Post.create(postParams);
user.addPost(post);
```

#### .set
`.set{target_model_name}( instance )`

If a model has a hasOne relationship established with another model, you can use this method to add an instace of one model to it’s “parent” model.

##### target_model_name
- The name of the model you’d like to set

##### instance
- `instace [modelInstance]`: The instance to set

##### example
```
var user = geddy.model.User.create(userParams);
var account = geddy.model.Account.create(accountParams);
user.setAccount(account);
```

#### .get
`.get{target_model_name}( fn )`

If a model has a hasOne relationship established with another model, you can use this method to add an instace of one model to it’s “parent” model.

##### target_model_name
- `hasMany`: the plural name of the model you’d like to get a collection of
- `hasOne`: the singular name of the model you like to get an instance of

##### fn
- `fn [function]`: The function to call once the models are retrieved.

##### example
```
var user = geddy.model.User.create(params);

// hasOne
user.getAccount(function (err, account) {
  // do stuff with the user’s account
});

// hasMany
user.getPosts(function (err, posts) {
  // do stuff with the user’s posts
});
```

* * *

#### static

Static methods can be added by creating a method on the model definition object.

```
var User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
};

User.findByLogin = function (login, callback) {
  User.all({login: login}, callback);
}
```

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
- `query [string]`: if the query is a string, it will be assumed that it's an id

##### query [object]
- `query [object]`: if the query is an object, it will be interpreted as a Query object

##### example
```
User.first('sdfs-asd-1', function (err, user) {
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
- `sort [object]`: each key is a property name, each value can either be `asc` or `desc`.
- `includes [array]`: Using SQL adapters, you may supply an array of model association names to eager-load.

##### example
```
User.all({location: 'san francisco'}, function (err, users) {
  // do stuff with users
});


User.all({location: 'san francisco'}, {sort: {createdAt: 'desc'}}, function (err, users) {
  // do stuff with users
});

// Eager-load associations of this model. (Only works on SQL adapters.)
User.all({location: 'san francisco'}, {includes: ['posts']}, function (err, users) {
  // do stuff with users - each "user" will have a "posts" property eager-loaded from the DB
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
User.remove('abc-123', function (err, data) {
  // do something now that it's removed.
});
```

`remove(condition, fn)`

Remove instances from the database by condition

##### condition
- `condition [object]`: the query condition of instances to be removed

##### examples
```
User.remove({state: "inactive"}, function (err, data) {
  // do something now that it's removed.
});
```

* * *

#### queries

Model uses a simple API for finding and sorting items. Again, it should look
familiar to anyone who has used a similar ORM for looking up records. The only
wrinkle with Model is that the API is (as you might expect for a NodeJS library)
asynchronous.

##### comparison operators
- `eql`: equal to
- `ne`: not equal to
- `gt`: greater than
- `lt`: less than
- `gte`: greater than or equal
- `lte`: less than or equal
- `like`: like

A simple string-value for a query parameter is the same as 'eql'. `{foo: 'bar'}`
is the same as `{foo: {eql: 'bar'}}`.

##### combining queries
Model supports combining queries with OR and negating queries with NOT.

To perform an 'or' query, use an object-literal with a key of 'or', and an array
of query-objects to represent each set of alternative conditions.

To negate a query with 'not', simply use a query-object where 'not' is the key,
and the value is the set of conditions to negate.


##### examples
```javascript
{foo: 'BAR', bar: {ne: null}}
// Where "foo" is 'BAR' and "bar" is not null

{foo: {'like': 'B'}}
// Where "foo" begins with 'B'

{foo: {lt: 2112}, bar: 'BAZ'}
// Where foo is less than 2112, and bar is 'BAZ'

{or: [{foo: 'BAR'}, {bar: 'BAZ'}]}
// Where "foo" is 'BAR' OR "bar" is 'BAZ'

{or: [{foo {ne: 'BAR'}}, {bar: null}, {baz: {lt: 2112}}]}
// Where "foo" is not 'BAR' OR "bar" is null OR "baz" is less than 2112

{not: {foo: 'BAR', bar: 'BAZ'}}
// Where NOT ("foo" is 'BAR' and "bar" is 'BAZ')

{not: {foo: 'BAZ', bar: {lt: 1001}}}
// Where NOT ("foo" is 'BAZ' and "bar" is less than 1001)

{or: [{foo: {'like': 'b'}}, {foo: 'foo'}], not: {foo: 'baz'}}
// Where ("foo" is like 'b' OR "foo" is 'foo') and NOT "foo" is 'baz'
```

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
