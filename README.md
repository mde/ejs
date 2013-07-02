# Geddy
####A simple, structured web framework for Node

```
$ npm install -g geddy
$ geddy app my_app
$ cd my_app
$ geddy
// app now running on localhost:4000
```

[![Build Status](https://travis-ci.org/mde/geddy.png?branch=master)](https://travis-ci.org/mde/geddy)

### Documentation

Docs are located on the GeddyJS website: http://geddyjs.org/documentation

### Goals

  * Easy to use
  * Modular
  * Fast

Geddy should make things easy for the most basic applications,
but still let you get under the hood and tinker if you want.

### Features

  * Powerful, flexible router
  * Easy resource-based routing
  * Database adapters for Postgres, MongoDB, Riak, and in-memory
  * App, resource and scaffold generators
  * Content-negotiation
  * Session support (in-memory, cookie)
  * Multiple template engine support (EJS, Jade, Mustache, Handlebars, Swig)
  * Real Time API generation (socket.io integration)
  * View helpers ([Docs](https://github.com/mde/geddy/wiki/View-Helpers))
  * Fully non-blocking

### License

Apache License, Version 2

### Prerequisites

Geddy requires version 0.8.x of Node.js or higher, and the
[Jake](https://github.com/mde/jake) JavaScript build-tool.

### Installing with [NPM](http://npmjs.org/)

```
[sudo] npm -g install geddy
```

Note: Geddy (specifically, the generators) is a system-level
tool, and wants to be installed globally.

### Creating a Geddy application

To create Geddy applications simply run `geddy app <name>`.
Then you can run `geddy` inside the application to start the server.

```
mde@localhost:~/work$ geddy app bytor
Created app bytor.
mde@localhost:~/work$ cd bytor
mde@localhost:~/work/bytor$ geddy
Server running at http://127.0.0.1:4000/
```

Go to http://localhost:4000/, and you should see the introduction page.

### Generating resources

Use `geddy resource <name> [model properties]` to generate a resource in your application.
A resources does not generate a view, but creates a view directory. A resource route will be
created for you.

````
mde@localhost:~/work$ geddy resource snow_dog breed:string name:string color:string
[Added] app/models/snow_dog.js
[Added] app/controllers/snow_dogs.js
[Added] Resource snow_dogs route added to config/router.js
[Added] snow_dogs view directory
```

Now start your Geddy server and your new route will work. Trying this for example
will return the params for the index action in JSON:

```
$ curl localhost:4000/snow_dogs.json
{"params":{"method":"GET","controller":"SnowDogs","action":"index","format":"json"}}
```

Geddy generators handle plural inflections for model and controller names (e.g., "person" to "people").
To read about the model properties argument, see [Model properties](#model-properties).

### Generating scaffolding

Use `geddy scaffold <name> [model properties]` to generate scaffoling in your application.
Scaffolding creates full CRUD actions, includes views, and will default your configuration to use
[Mongodb](http://www.mongodb.org/). Resource routes will be created for you.

````
mde@localhost:~/work$ geddy scaffold snow_dog breed:string name:string color:string
[Added] app/models/snow_dog.js
[Added] app/controllers/snow_dogs.js
[Added] Resource snow_dogs route added to config/router.js
[Added] View templates
[Added] Database configuration to config/environment.js
```

Now start your Geddy server and you'll have new views created from scaffolding. Trying this for example
will return the content for the index action in HTML:

```
$ curl localhost:4000/snow_dogs
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Geddy App | This app uses Geddy.js</title>
    <meta name="description" content="">
    <meta name="author" content="">

    <meta name="viewport" content="width=device-width" />

    <!-- The HTML5 shim, for IE6-8 support of HTML elements -->
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

.....
```

### Model properties

Some Geddy generators (resource, scaffold, and model) have an argument that takes a list of model
properties. Here's an example of a resource with some properties:

```
geddy resource user name admin:boolean lastLogin:datetime
```

Each of these items include a name and an optional type. If there's no type given, it will default
to string. The list of supported types are listed in the [model](https://github.com/mde/geddy/wiki/Models) documentation.
If no id property is given, then a default id property will be created with the type of string.

You can also use custom default properties:
```
geddy resource user name:default admin:boolean
```
The above example will use the property `name`(string) to display the items in the views instead of the default ID property. This way when generating scaffolds, it will look better out of the box.

### Routes

Geddy uses the Barista router: https://github.com/kieran/barista

Routes are created in a similar fashion to Merb or Rails.

***Basic routes***
```
router.match('/moving/pictures/:id').to(
  {controller: 'Moving', action: 'pictures'});

router.match('/farewells/:farewelltype/kings/:kingid').to(
   {controller: 'Farewells', action: 'kings'});

//Can also match specific HTTP methods only
router.match('/xandadu', 'get').to(
  {controller: 'Xanadu', action: 'specialHandler'});
```

***Resource routes***
```
router.resource('hemispheres');
```

### Resources and controllers

Geddy's resource-based routes create url/request-method mappings
for easy CRUD operations:

```
GET */snow_dogs[.extension]
(SnowDogs controller, index action)

GET */snow_dogs/add[.extension]
(SnowDogs controller, add action, for any new resource template; "new" is not usable as a JavaScript action name)

POST */snow_dogs[.extension]
(SnowDogs controller, create action)

GET */snow_dogs/:id[.extension]
(SnowDogs controller, show action)

GET */snow_dogs/:id/edit[.extension]
(SnowDogs controller, edit action)

PUT */snow_dogs/:id[.extension]
(SnowDogs controller, update action)

DELETE */snow_dogs/:id[.extension]
(SnowDogs controller, remove action)
```

A simple controller that just responds with any
form-post/query-string params looks like this:

```javascript
var SnowDogs = function () {
  this.respondsWith = ['text', 'json', 'html'];

  this.index = function (params) {
    this.respond({params: params});
  };

  this.add = function (params) {
    this.respond({params: params});
  };

  this.create = function (params) {
    this.respond({params: params});
  };

  this.show = function (params) {
    this.respond({params: params});
  };

  this.update = function (params) {
    this.respond({params: params});
  };

  this.remove = function (params) {
    this.respond({params: params});
  };

};

exports.SnowDogs = SnowDogs;
```

## Content-negotiation

Geddy can perform content-negotiation, and respond with with the
correct format based on the requested filename extension.

If you have a JSON-serializable JavaScript object you want to
return in JSON format, pass your JavaScript object to the
`respond` method in the action on that controller.

```javascript
this.respondsWith = ['text', 'json'];

this.show = function (params) {
  item = {foo: 'FOO', bar: 1, baz: false};
  this.respond(item);
};
```
## Models and validations

Geddy has a simple way of defining models with a full-featured
set of data validations. The syntax is similar to models in
Ruby's ActiveRecord or DataMapper.

Here is an example of a model with some validations:

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

User = geddy.model.register('User', User);
```

Alternatively, you can use the `defineProperties` method to lay out your model:

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

Data-validation happens on the call to `create`, and any
validation errors show up inside an `errors` property on
the instance, keyed by field name. Instances have a `valid`
method that returns a Boolean indicating whether the instance
is valid.

```javascript
// Leaving out the required password field
var params = {
  login: 'alex'
};
var user = User.create(params);

// Prints 'false'
util.puts(user.valid());
// Prints 'Field "password" is required'
util.puts(user.errors.password);
```

## Running the tests

In the geddy project directory, run `jake test`. The tests simply
use NodeJS's `assert` module, which throws an error on failure.
If there are no errors, the tests all ran successfully.

- - -
Geddy Web-app development framework copyright 2112
mde@fleegix.org.

