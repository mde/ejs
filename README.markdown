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
  * Templating (EJS), partials support
  * Fully non-blocking

### License

Apache License, Version 2

### Routes

Routes are similar to Merb or Rails routes. 

**Basic routes**
  
    router.match('/moving/pictures/:id').to(
      {controller: 'Moving', action: 'pictures'});
    router.match('/farewells/:farewelltype/kings/:kingid').to(
       {controller: 'Farewells', action: 'kings'});
    Can also match specific HTTP methods only
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
    Server running at http://127.0.0.1:8000/

Go to http://localhost:8000/, and you should see:

"Attention all planets of the Solar Federation"

### Adding resources

Use `geddy-gen resource` in your app directory to create one.

    mde@localhost:~/work/bytor$ geddy-gen resource snow_dogs
    [ADDED] ./app/controllers/snow_dogs.js
    resources snow_dogs route added to ./config/router.js
    Created view templates.

Restart Geddy, and you'll see the new route working. Hit your
new route -- for example, http://localhost:8000/snow_dogs.json,
and you should see something like this:

{"method":"index","params":{"extension":"json"}}


- - -
Geddy Web-app development framework copyright 2112
mde@fleegix.org.

