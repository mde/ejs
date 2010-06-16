## Geddy: a small, hackable Web app development framework for Node.js
- - -

### Goals

  * Make the simple stuff easy without making the hard stuff impossible
  * Performance, simplicity, modularity
  * Reasonable defaults, easy to override
  * Simple API, simple codebase

Geddy should make things easy for the most basic applications,
but still let you get under the hood and tinker if you want.

### Features

  * Powerful, flexible router
  * Easy resource-based routing
  * App and resource generators
  * Content-negotiation
  * Session support (in-memory and CouchDB)
  * Templating (EJS), partials support
  * Fully non-blocking

### License

Apache License, Version 2

### Community

IRC:

\#node.js on freenode.net

Mailing list:

http://groups.google.com/group/geddy

### Building and installing Geddy

** Prerequisites**

Geddy requires version 0.1.94 of Node.js.

To get Geddy from GitHub and install it:

    git clone git://github.com/mde/geddy.git
    cd geddy
    make && sudo make install

### Routes

Routes are similar to Merb or Rails routes.

**Basic routes**

    router.match('/moving/pictures/:id').to(
      {controller: 'Moving', action: 'pictures'});

    router.match('/farewells/:farewelltype/kings/:kingid').to(
       {controller: 'Farewells', action: 'kings'});

    //Can also match specific HTTP methods only
    router.match('/xandadu', 'get').to(
      {controller: 'Xandadu', action: 'specialHandler'});

**Resource-based routes**

    router.resource('hemispheres');

### Creating a Geddy app

Geddy comes with a utility called `geddy-gen` you can use to
create an app. Run `geddy` to start the server.

    mde@localhost:~/work$ geddy-gen app bytor
    Created app bytor.
    mde@localhost:~/work$ cd bytor
    mde@localhost:~/work/bytor$ geddy
    Server running at http://127.0.0.1:4000/

Go to http://localhost:4000/, and you should see:

Attention all planets of the Solar Federation

### Adding resources

Use `geddy-gen resource` in your app directory to add a
resource. The route will be set up automatically for you.

    mde@localhost:~/work/bytor$ geddy-gen resource snow_dog
    [ADDED] ./app/models/snow_dog.js
    [ADDED] ./app/controllers/snow_dogs.js
    resources snow_dogs route added to ./config/router.js
    Created view templates.

Restart Geddy, and you'll see the new route working. Hit your
new route -- for example, http://localhost:4000/snow_dogs.json,
and you should see something like this:

{"method":"index","params":{"extension":"json"}}

The geddy-gen utility doesn't handle fancy pluralization between
model and controller -- the default is simply to add an "s"
to your resource name to use for the plural in controller
names and paths.

However, you can specify different singular/plural names when
generating your resource. Separate the singular and plural
names by a comma, like this:

    mde@localhost:~/work/bytor$ geddy-gen resource person,people
    [ADDED] ./app/models/person.js
    [ADDED] ./app/controllers/people.js
    resources people route added to ./config/router.js
    Created view templates.

### App layout

After adding a resource, a Geddy app is laid out like this:

    mde@localhost:~/work/bytor$ find .
    .
    ./config
    ./config/config.js
    ./config/router.js
    ./app
    ./app/controllers
    ./app/controllers/snow_dogs.js
    ./app/controllers/main.js
    ./app/controllers/application.js
    ./app/views
    ./app/views/snow_dogs
    ./app/views/snow_dogs/show.html.ejs
    ./app/views/snow_dogs/add.html.ejs
    ./app/views/snow_dogs/index.html.ejs
    ./public

### Resources and controllers

Geddy's resource-based routes create url/request-method mappings
for easy CRUD operations like this:

GET */snow_dogs[.extension]<br/>
(SnowDogs controller, index action)

GET */snow_dogs/add[.extension]<br/>
(SnowDogs controller, add action, for any new-resource template
-- "new" is not usable as a JavaScript action name)

POST */snow_dogs[.extension]<br/>
(SnowDogs controller, create action)

GET */snow_dogs/:id[.extension]<br/>
(SnowDogs controller, show action)

GET */snow_dogs/:id/edit[.extension]<br/>
(SnowDogs controller, edit action)

PUT */snow_dogs/:id[.extension]<br/>
(SnowDogs controller, update action)

DELETE */snow_dogs/:id[.extension]<br/>
(SnowDogs controller, remove action)

A simple controller that just responds with any
form-post/query-string params looks like this:

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


## Content-negotiation

Geddy has built-in ability to perform content-negotiation
based on the requested filename-extension.

If you have a JSON-serializable JavaScript object you want
to return in JSON format, pass your JavaScript object to the
`respond` method in the action on that controller.

    this.respondsWith = ['text', 'json'];

    this.show = function (params) {
      // (Fetch some item by params.id)
        item = {foo: 'FOO', bar: 1, baz: false};
          this.respond(item);
    };

## Models and validations

Geddy has an easy, intuitive way of defining models, with
a full-featured set of data validations. The syntax is very
similar to models in Ruby's ActiveRecord or DataMapper.

The model module is coded with browser-based use in mind,
so it's very easy to share model and input validation code in
your app between client and server.

Here is an example of a model with some validations:

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

    // Server-side, commonjs
    exports.User = User;
    // Client-side
    // geddy.model.registerModel('User');

Creating an instance of one of these models is easy:

    var params = {
      login: 'alex',
      password: 'lerxst',
      lastName: 'Lifeson',
      firstName: 'Alex'
    };
    var user = User.create(params);

Data-validation happens on the call to `create`, and any
validation errors show up inside an `errors` property on
the instance, keyed by field name. Instances have a `valid`
method that returns a Boolean indicating whether the instance
is valid.

    // Leaving out the required password field
    var params = {
      login: 'alex',
    };
    var user = User.create(params);

    // Prints 'false'
    sys.puts(user.valid());
    // Prints 'Field "password" is required'
    sys.puts(user.errors.password);

- - -
Geddy Web-app development framework copyright 2112
mde@fleegix.org.

