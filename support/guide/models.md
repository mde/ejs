Model currently implements adapters for:

* Postgres
* Riak
* MongoDB

### Defining models

Model uses a pretty simple syntax for defining a model. (It should look familiar
to anyone who has used an ORM like ActiveRecord, DataMapper, Django's models, or
SQLAlchemy.)

```javascript
var User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  this.validatesConfirmed('password', 'confirmPassword');
  this.validatesWithFunction('password', function (s) {
      // Something that returns true or false
      return s.length > 0;
  });

  // Can define methods for instances like this
  this.someMethod = function () {
    // Do some stuff
  };
};

// Can also define them on the prototype
User.prototype.someOtherMethod = function () {
  // Do some other stuff
};

exports.User = User;
```

#### Abbreviated syntax

Alternatively, you can use the `defineProperties` method to lay out your model's
properties in one go:

```javascript
var User = function () {
  this.defineProperties({
    login: {type: 'string', required: true}
  , password: {type: 'string', required: true}
  , lastName: {type: 'string'}
  , firstName: {type: 'string'}
  });
}
```

#### Datatypes

Model supports the following datatypes:

* string
* text
* number
* int
* boolean
* date
* datetime
* time
* object

### Creating instances

Creating an instance of one of these models is easy:

```javascript
var params = {
  login: 'alex'
, password: 'lerxst'
, lastName: 'Lifeson'
, firstName: 'Alex'
};
var user = User.create(params);
```

### Validations

Validations provide a nice API for making sure your data items are in a good
state. When an item is "valid," it means that its data meet all the criteria
you've set for it. You can specify that certain fields have to be present, have
to be certain length, or meet any other specific criteria you want to set.

Here's a list of supported validation methods:

 * validatesPresent -- ensures the property exists
 * validatesAbsent -- ensures the property does not exist
 * validatesLength -- ensures the minimum, maximum, or exact length
 * validatesFormat -- validates using a passed-in regex
 * validatesConfirmed -- validates a match against another named parameter
 * validatesWithFunction -- uses an arbitrary function to validate

#### Common options

You can specify a custom error message for when a validation fails using the
'message' option:

```javascript
var Zerb = function () {
  this.property('name', 'string');
  this.validatesLength('name', {is: 3, message: 'Try again, gotta be 3!'});
};
```

You can decide when you want validations to run by passing the 'on' option.

```javascript
var User = function () {
  this.property('name', 'string', {required: false});
  this.property('password', 'string', {required: false});

  this.validatesLength('name', {min: 3, on: ['create', 'update']});
  this.validatesPresent('password', {on: 'create'});
  this.validatesConfirmed('password', 'confirmPassword', {on: 'create'});
};

// Name validation will pass, but password will fail
myUser = User.create({name: 'aaa'});

```

The default behavior is for validation on both 'create' and 'update':

 * `create` - validates on <MyModelDefinition>`.create`
 * `update` - validates on <myModelInstance>`.updateProperties`

You can also define custom validation scenarios other than create and update.
(There is a builtin custom 'reify' scenario which is uses when instantiating
items out of your datastore. This happens on the `first` and `all` query
methods.)

```javascript
// Force validation with the `reify` scenario, ignore the too-short name property
myUser = User.create({name: 'aa'}, {scenario: 'reify'});

// You can also specify a scenario with these methods:
// Enforce 'create' validations on a fetch -- may result in invalid instances
User.first(query, {scenario: 'create'}, cb);
// Do some special validations you need for credit-card payment
User.updateProperties(newAttrs, {scenario: 'creditCardPayment'});
```

#### Validation errors

Any validation errors show up inside an `errors` property on the instance, keyed
by field name. Instances have an `isValid` method that returns a Boolean
indicating whether the instance is valid.

```javascript
// Leaving out the required password field
var params = {
  login: 'alex'
};
var user = User.create(params);

// Prints 'false'
console.log(user.isValid());
// Prints 'Field "password" is required'
console.log(user.errors.password);
```


### Saving items

After creating the instance, call the `save` method on the instance. This method
takes a callback in the familiar (err, data) format for Node.

```javascript
if (user.isValid()) {
  user.save(function (err, data) {
    if (err) {
      throw err;
    }
    console.log('New item saved!');
  });
}
```

### Updating items

Use the `updateProperties` method to update the values of the properties on an
instance with the appropriate validations. Then call `save` on the instance.

```javascript
user.updateProperties({
  login: 'alerxst'
});
if (user.isValid()) {
  user.save(function (err, data) {
    if (err) {
      throw err;
    }
    console.log('Item updated!');
  });
}
```

### Lifecycle events

Both the base model 'constructors,' and model instances are EventEmitters. They
emit events during the create/update/remove lifecycle of model instances. In all
cases, the plain-named event is fired after the event in question, the
'before'-prefixed event, of course happens before.

The 'constructor' for a model emits the following events:

 * beforeCreate
 * create
 * beforeValidate
 * validate
 * beforeUpdateProperties
 * updateProperties
 * beforeSave (new instances, single and bulk)
 * save (new instances, single and bulk)
 * beforeUpdate (existing single instances, bulk updates)
 * update (existing single instances, bulk updates)
 * beforeRemove
 * remove

Model-item instances emit these events:

 * beforeUpdateProperties
 * updateProperties
 * beforeSave
 * save
 * beforeUpdate
 * update

### Associations

Model has support for associations: including hasMany/belongsTo and
hasOne/belongsTo. For example, if you had a `User` model with a single
`Profile`, and potentially many `Accounts`:

```javascript
var User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('confirmPassword', 'string', {required: true});

  this.hasOne('Profile');
  this.hasMany('Accounts');
};
```

A `Book` model that belongs to an `Author` would look like this:

```javascript
var Book = function () {
  this.property('title', 'string');
  this.property('description', 'text');

  this.belongsTo('Author');
};
```

Add the `hasOne` relationship by calling 'set' plus the name of the owned
model in singular (in this case `setProfile`). Retrieve the associated item by
using 'get' plus the name of the owned model in singular (in this case
`getProfile`). Here's an example:

```javascript
var user = User.create({
  login: 'asdf'
, password: 'zerb'
, confirmPassword: 'zerb'
});
user.save(function (err, data) {
  var profile;
  if (err) {
    throw err;
  }
  profile = Profile.create({});
  user.setProfile(profile);
  user.save(function (err, data) {
    if (err) {
      throw err;
    }
    user.getProfile(function (err, data) {
      if (err) {
        throw err;
      }
      console.log(profile.id ' is the same as ' + data.id);
    });
  });
});
```

Set up the `hasMany` relationship by calling 'add' plus the name of the
owned model in singular (in this case `addAccount`). Retrieve the associated
items with a call to 'get' plus the name of the owned model in plural (in
this case `getAccounts`). An example:

```javascript
var user = User.create({
  login: 'asdf'
, password: 'zerb'
, confirmPassword: 'zerb'
});
user.save(function (err, data) {
  if (err) {
    throw err;
  }
  user.addAccount(Account.create({}));
  user.addAccount(Account.create({}));
  user.save(function (err, data) {
    if (err) {
      throw err;
    }
    user.getAccounts(function (err, data) {
      if (err) {
        throw err;
      }
      console.log('This number should be 2: ' + data.length);
    });
  });
});
```

A `belongsTo` relationship is created similarly to a `hasOne`: by calling 'set'
plus the name of the owner model in singular (in this case `setAuthor`).
Retrieve the associated item by using 'get' plus the name of the owner model
in singular (in this case `getAuthor`). Here's an example:

```javascript
var book = Book.create({
  title: 'How to Eat an Entire Ham'
, description: 'Such a poignant book. I cried.'
});
book.save(function (err, data) {
  if (err) {
    throw err;
  }
  book.setAuthor(Author.create({
    familyName: 'Neeble'
  , givenName: 'Leonard'
  }));
  book.save(function (err, data) {
    if (err) {
      throw err;
    }
    book.getAuthor(function (err, data) {
      if (err) {
        throw err;
      }
      console.log('This name should be "Neeble": ' + data.familyName);
    });
  });
});
```

#### 'Through' associations

'Through' associations allow a model to be associated with another *through* a
third model. A good example would be a Team linked to Players through
Memberships.

```javascript
var Player = function () {
  this.property('familyName', 'string', {required: true});
  this.property('givenName', 'string', {required: true});
  this.property('jerseyNumber', 'string', {required: true});

  this.hasMany('Memberships');
  this.hasMany('Teams', {through: 'Memberships'});
};

var Team = function () {
  this.property('name', 'string', {required: true});

  this.hasMany('Memberships');
  this.hasMany('Players', {through: 'Memberships'});
};

var Membership = function () {
  this.hasMany('Memberships');
  this.hasMany('Teams');
};
```

The API for this is the same as with normal associations, using the `set`/`add`
and `get`, with the appropriate association name (not the model name). For
example, in the case of the Team adding Players, you'd use `addPlayer` and
`getPlayer`.

#### Named associations

Sometimes you need mutliple associations to the same type of model (e.g., I have
lots of Friends and Relatives who are all Users). You can accomplish this in
Model using named associations:

```javascript
var User = function () {
  this.property('familyName', 'string', {required: true});
  this.property('givenName', 'string', {required: true});

  this.hasMany('Kids', {model: 'Users'});
};
```

The API for this is the same as with normal associations, using the `set`/`add`
and `get`, with the appropriate association name (not the model name). For
example, in the case of `Kids`, you'd use `addKid` and `getKids`.

### Querying

Model uses a simple API for finding and sorting items. Again, it should look
familiar to anyone who has used a similar ORM for looking up records. The only
wrinkle with Model is that the API is (as you might expect for a NodeJS library)
asynchronous.

Methods for querying are static methods on each model constructor.

#### Finding a single item

Use the `first` method to find a single item. You can pass it an id, or a set of
query parameters in the form of an object-literal. In the case of a query, it
will return the first item that matches, according to whatever sort you've
specified.

```javascript
var user;
User.first({login: 'alerxst'}, function (err, data) {
  if (err) {
    throw err;
  }
  user = data;
  console.log('Found user');
  console.dir(user);
});
```

#### Collections of items

Use the `all` method to find lots of items. Pass it a set of query parameters in
the form of an object-literal, where each key is a field to compare, and the
value is either a simple value for comparison (equal to), or another
object-literal where the key is the comparison-operator, and the value is the
value to use for the comparison.

```javascript
var users
  , dt;

dt = new Date();
dt.setHours(dt.getHours() - 24);

// Find all the users created since yesterday
User.all({createdAt: {gt: dt}, function (err, data) {
  if (err) {
    throw err;
  }
  users = data;
  console.log('Found users');
  console.dir(users);
});
```

Here are some more examples of queries:

```javascript
// Where "foo" is 'BAR' and "bar" is not null
{foo: 'BAR', bar: {ne: null}}
// Where "foo" begins with 'B'
{foo: {'like': 'B'}}
// Where foo is less than 2112, and bar is 'BAZ'
{foo: {lt: 2112}, bar: 'BAZ'}
```

#### Comparison operators

Here is the list of comparison operators currently supported:

 * eql: equal to
 * ne: not equal to
 * gt: greater than
 * lt: less than
 * gte: greater than or equal
 * lte: less than or equal
 * like: like

A simple string-value for a query parameter is the same as 'eql'. `{foo: 'bar'}`
is the same as `{foo: {eql: 'bar'}}`.

For case-insensitive comparisons, use the 'nocase' option. Set it to `true` to
affect all 'like' or equality comparisons, or use an array of specific keys you
want to affect.

```javascript
// Zoobies whose "foo" begin with 'b', with no case-sensitivity
Zooby.all({foo: {'like': 'b'}}, {nocase: true}, ...
// Zoobies whose "foo" begin with 'b' and "bar" is 'baz'
// The "bar" comparison will be case-sensitive, and the "foo" will not
Zooby.all({or: [{foo: {'like': 'b'}}, {bar: 'baz'}]}, {nocase: ['foo']},
```
### More complex queries

Model supports combining queries with OR and negating queries with NOT.

To perform an 'or' query, use an object-literal with a key of 'or', and an array
of query-objects to represent each set of alternative conditions:

```javascript
// Where "foo" is 'BAR' OR "bar" is 'BAZ'
{or: [{foo: 'BAR'}, {bar: 'BAZ'}]}
// Where "foo" is not 'BAR' OR "bar" is null OR "baz" is less than 2112
{or: [{foo {ne: 'BAR'}}, {bar: null}, {baz: {lt: 2112}}]}
```

To negate a query with 'not', simply use a query-object where 'not' is the key,
and the value is the set of conditions to negate:

```javascript
// Where NOT ("foo" is 'BAR' and "bar" is 'BAZ')
{not: {foo: 'BAR', bar: 'BAZ'}}
// Where NOT ("foo" is 'BAZ' and "bar" is less than 1001)
{not: {foo: 'BAZ', bar: {lt: 1001}}}
```

These OR and NOT queries can be nested and combined:

```javascript
// Where ("foo" is like 'b' OR "foo" is 'foo') and NOT "foo" is 'baz'
{or: [{foo: {'like': 'b'}}, {foo: 'foo'}], not: {foo: 'baz'}}
```

### Options: sort, skip, limit

The `all` API-call for querying accepts an optional options-object after the
query-conditions for doing sorting, skipping to particular records (i.e., SQL
OFFSET), and limiting the number of results returned.

#### Sorting

Set a 'sort' in that options-object to specifiy properties to
sort on, and the sort-direction for each one:

```javascript
var users
// Find all the users who have ever been updated, and sort by
// creation-date, ascending, then last name, descending
User.all({updatedAt: {ne: null}}, {sort: {createdAt: 'asc', lastName: 'desc'}},
    function (err, data) {
  if (err) {
    throw err;
  }
  users = data;
  console.log('Updated users');
  console.dir(users);
});
```

#### Simplified syntax for sorting

You can use a simplified syntax for specifying the sort. The default
sort-direction is ascending ('asc'), so you can specify a property to sort on
(or multiple properties as an array) if you want all sorts to be ascending:

```javascript
// Sort by createdAt, ascending
{sort: 'createdAt'}
// Sort by createdAt, then updatedAt, then lastName,
// then firstName -- all ascending
{sort: ['createdAt', 'updatedAt', 'lastName', 'firstName']}
```

#### Skip and limit

The 'skip' option allows you to return records beginning at a certain item
number. Using 'limit' will return you only the desired number of items in your
response. Using these options together allow you to implement pagination.

Remember that both these option assume you have your items sorted in the
desired order. If you don't sort your items before using these options, you'll
end up with a random subset instead of the items you want.

```javascript
// Returns items 501-600
{skip: 500, limit: 100}

```

### Eager loading of associations (SQL adpaters only)

You can use the 'includes' option to specify second-order associations that
should be eager-loaded in a particular query (avoiding the so-called N + 1 Query
Problem). This will also work for 'through' associations.

For example, with a Team that `hasMany` Players through Memberships, you might
want to display the roster of player for every team when you display teams in a
list. You could do it like so:

```javascript
var opts = {
  includes: ['players']
, sort: {
    name: 'desc'
  , 'players.familyName': 'desc'
  , 'players.givenName': 'desc'
  }
};
Team.all({}, opts, function (err, data) {
  var teams;
  if (err) {
    throw err;
  }
  teams = data;
  teams.forEach(function (team) {
    console.log(team.name);
    team.players.forEach(function (player) {
      console.log(player.familyName + ', ' + player.givenName);
    });
  });
});
```

#### Sorting results

Notice that it's possible to sort the eager-loaded associations in the above
query. Just pass the association-names + properties in the 'sort' property.

In the above example, the 'name' property of the sort refers to the team-names.
The other two, 'players.familyName' and 'players.givenName', refer to the loaded
associations. This will result in a list where the teams are initially sorted by
name, and the contents of their 'players' list have the players sorted by given
name, then first name.

#### Checking for loaded associations

The eagerly fetched association will be in a property on the top-level item with
the same name as the association (e.g., Players will be in `players`).

If you have an item, and you're not certain whether an association is already
loaded, you can check for the existence of this property before doing a per-item
fetch:

```javascript
if (!someTeam.players) {
  someTeam.getPlayers(function (err, data) {
    console.dir(data);
  });
}
```

### Migrations (SQL adapters only)

Migrations are a convenient way to make changes to your SQL database schema over
time, consistently and easily. They use a simply JavaScript API. This means
that you don't have to write SQL by hand, and changes to your schema can be
database independent.

This is an example of a migration:

```javascript
var CreateUsers = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('username', 'string');
          t.column('password', 'string');
          t.column('familyName', 'string');
          t.column('givenName', 'string');
          t.column('email', 'string');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('users', def, callback);
  };

  this.down = function (next) {
    var callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.dropTable('users', callback);
  };
};

exports.CreateUsers = CreateUsers;
```

This migration will create a 'users' table a number of columns of
string (varchar(256)) datatype.

An 'id' column will be added implicitly, as well as timestamp columns for the
'createdAt' and 'updatedAt' properties of data items. (These will be in
snake-case in the database, e.g., 'created_at'.) These properties are
automatically managed by Model.

The `up` method makes the change (in this case, creating the table), and the
`down` method reverses the change. The `down` method is used to roll back
undesirable changes.

#### Setting up your DB to use migrations

Inside your app, run `geddy jake db:init` to create the 'migrations' table. You
have to do this before you can use migrations.

#### Creating a migration

Migrations live in the db/migrations folder in your application. The name is in
the form  YYYYMMDDHHMMSS_my_migration_name.js. Using these timestamps with
migration names allows you to run migrations in the order in which they're
created, even with different developers working independently, creating
migrations at overlapping times.

To create a new migration, run the generator script:

```
$ ../geddy/bin/cli.js gen migration zerp_derp
[Added] db/migrations/20130708212330_zerp_derp.js
```
If you open the new migration file, you'll see a blank migration file ready to be filled in:

```javascript
var ZerpDerp = function () {
  this.up = function (next) {
    next();
  };

  this.down = function (next) {
    next();
  };
};

exports.ZerpDerp = ZerpDerp;
```

#### Migrations API

`createTable(name<string>, definition<function>,
    callback<function>)`

Creates a new table. The `definition` function is used to define the columns on
the new table.

```javascript
// CREATE TABLE distributors (id string PRIMARY KEY, address varchar(256),
// created_at timestamp, updated_at timestamp);
this.createTable('distributors',
    function (t) { t.column('address', 'string'); },
    function (err, data) {});
```

`dropTable(name<string>, callback<function>)`

Drops an existing table.

```javascript
// DROP TABLE IF EXISTS distributors;
this.dropTable('distributors', function (err, data) {});
```

`addColumn(table<string>, column<string>, datatype<string>,
    callback<function>)`

Adds a column to an existing table.

```javascript
// ALTER TABLE distributors ADD COLUMN address varchar(30);
this.addColumn('distributors', 'address', 'string',
    function (err, data) {});
```

`removeColumn(table<string>, column<string>, callback<function>)`

Removes a column from an existing table.

```javascript
// ALTER TABLE distributors DROP COLUMN address;
this.removeColumn('distributors', 'address',
    function (err, data) {});
```

`changeColumn(table<string>, column<string>, datatype<string>,
    callback<function>)`

Changes a column on an existing table from one datatype to another.

```javascript
// ALTER TABLE distributors ALTER COLUMN address TYPE text;
this.changeColumn('distributors', 'address', 'text',
    function (err, data) {});
```

`renameColumn(table<string>, column<string>, newColumn<string>,
    callback<function>)`

Renames a column on an existing table.

```javascript
// ALTER TABLE distributors RENAME COLUMN address TO city;
this.renameColumn('distributors', 'address', 'city',
    function (err, data) {});
```

#### Migrations for scaffolds

Using Geddy's scaffold-generators will also create the appropriate migration
file for you.

For example, with the following generator command:

```
$ geddy gen scaffold frang asdf:string qwer:int
```

You'll end up with the following migration to run to create the corresponding
table for your model:

```javascript
var CreateFrangs = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('asdf', 'string');
          t.column('qwer', 'int');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('frang', def, callback);
  };

  this.down = function (next) {
    var callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.dropTable('frang', callback);
  };
};

exports.CreateFrangs = CreateFrangs;
```

#### Migrations FAQ

Q: If I'm using Geddy-Passport for auth, how do I create the migrations for it?

A: People running the `auth` generator will now get the migrations installed as
well, but if you've previously installed the auth code, you can grab the
migrations from here:
https://github.com/mde/geddy-passport/tree/master/db/migrations. They will
create 'users' and 'passport' tables with the correct associations columns.

Q: How do I handle associations with my migrations?

A: Right now there is not great support for migrations in the CLI generators.
You'll have to add the appropriate database-column entries into your migrations
manually before you run them. Essentially, four steps: 1. Run the CLI scaffold
generator to create your model-definition file, and your migration file. 2. Add
the association (e.g., `this.hasMany`) into your model-definition file. 3. Add
the appropriate database-column entry into your migration file. 4. Run the
migration to create your database table.

Here's an example from geddy-passport, with a hasMany and a belongsTo. We'll
start with a User model:

```javascript
var User = function () {
  this.defineProperties({
    username: {type: 'string', required: true},
    password: {type: 'string', required: true},
    familyName: {type: 'string', required: true},
    givenName: {type: 'string', required: true},
    email: {type: 'string', required: true}
  });

  this.validatesLength('username', {min: 3});
  this.validatesLength('password', {min: 8});
  this.validatesConfirmed('password', 'confirmPassword');

  this.hasMany('Passports');
};

exports.User = User;
```
A User model has many Passports, and a Passport belongs to a User:

```javascript
var Passport = function () {
  this.defineProperties({
    authType: {type: 'string'},
    key: {type: 'string'}
  });

  this.belongsTo('User');
};

exports.Passport = Passport;
```

This association will need a 'userId' property (a 'user_id' column) on the
Passport. Here's the migration:

```javascript
var CreatePassports = function () {
  this.up = function (next) {
    var def = function (t) {
          var datatype = geddy.model.autoIncrementId ? 'int' : 'string';
          t.column('authType', 'string');
          t.column('key', 'string');
          t.column('userId', datatype); // belongsTo User
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('passports', def, callback);
  };

  this.down = function (next) {
    var callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.dropTable('passports', callback);
  };
};

exports.CreatePassports = CreatePassports;
```

If you know what type of ids you're using, then you can skip the check for the
'userId' datatype -- just make it the same as the 'id' column on the owner
object.

Q: What happens if I change the associations, do I then re-run the migrations?

A: Right now, you'll have to manage the association columns manually with
`addColumn` and `removeColumn`. Better support for assocations in the CLI and in
migrations is coming in the next version of Geddy.

Q: How can I take an older Geddy app that has all its models and turn them into
a migrations-based thing?

A: The easiest thing to do would be to create a separate Geddy app, and use the
generator scripts to create the migrations you want. Run those migrations in an
empty DB, then import your data into that database using whatever tools your DB
provides (e.g., `pg_dump`).
