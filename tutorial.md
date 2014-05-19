### Introduction

In this tutorial we'll learn how to use Geddy by creating a simple To-Do
Manager applciation.

In this tutorial we'll cover:

-   Creating a Geddy application
-   Learning how to use the Geddy executable
-   Using Geddy models
-   How views in Geddy work
-   How to use controllers to tie everything together

### Installation

If you haven't already, install [Node](http://nodejs.org#download) on
your machine.

Next, install Geddy from [NPM](http://npmjs.org/), this will also
install [Jake](https://github.com/mde/jake):

```bash
$ npm install -g geddy
```

We need to install it globally (-g) so we can use geddy generators or
start the server. More on this later. (Note: installing packages globally
may require super-user access `sudo npm install -g geddy`)

Now that we have Geddy installed we need to learn how to use its generator
commands from the CLI. If no commands are given, Geddy will start up the server.
(if you try to run the `geddy` command outside the directory for a Geddy app, it
will output a message prompting you to view the help.)

[Click here](http://geddyjs.org/guide#CLI) for detailed docs for the Geddy CLI.

#### Using the `geddy gen` command

If you give Geddy the `gen` command, it can be used to generate applications or
resources for applications. We'll be using this command to create an app -- but
first, a quick overview of how the generator commands work.

Each of Geddy's generator commands (e.g., `app`, `resource`, `controller`, etc.)
takes an or set of arguments (excluding `secret`).

`app <name>`: Create a new Geddy application.

`app` takes a single argument: the name for your application's top-level
directory. You must include a name.

`secret`: Create an app-secret.

`secret` doesn't take any arguments. It will find your `config/environment` file
and create a new application secret in it, deleting any other secret. This
secret is used for things like creating session tokens and anti-CSRF tokens.

By default this file is in the .gitignore file for your application. If you
absolutely have to check it into revision control, you can use EJS syntax (<%=
%>) in it to include an environment variable for the actual value of your
secret.

`scaffold <name> [model properties]`: Creates a scaffolded resource.

`scaffold` takes one or more arguments: a name, followed by a set of model
properties. You can specify the datatype for the property after a colon (e.g.,
foo:string or bar:number).

A scaffolded resource includes a model, REST routes, a controller with
appropriate CRUD actions, and views.

If you also include the options `--swig`, `--jade`, `--handle`
or `--mustache` you can substitute the template language to your liking.

`resource <name> [model attributes]`: Creates a plain resource.

`resource` takes one or more arguments: a name, followed by a set of model
properties. You can specify the datatype for the property after a colon (e.g.,
foo:string or bar:number).

Simple resources include a model, REST routes, a controller with minimal CRUD
actions. It does not include views.

`controller <name>`: Generates a bare controller.

`controller` takes a single argument: a name.

A bare controller includes a controller, REST routes, and an index view.

If you also include the options `--swig`, `--jade`, `--handle`
or `--mustache` you can substitute the template language to your liking.

`model <name> [model attributes]`: Generates a new model.

`model` takes one or more arguments: a name, followed by a set of model
properties. You can specify the datatype for the property after a colon (e.g.,
foo:string or bar:number).

Generating models this way will only create a model file, and nothing else.

#### Model properties

There are three commands (`scaffold`, `resource`, `model`) that also include
model property arguments. This is a list seperated by spaces that includes the
property, its datatype and an optional flag for setting the 'default' property.

[Click here](http://geddyjs.org/guide#modelsDefining%20models) to see how Geddy
models are defined, and what datatypes are supported.

Here are some examples of how model properties are added:

```
$ geddy gen scaffold book title:string description:text
```

The example above will create a scaffolded model that includes a `title` property
of type `string`, and a `description` property of type `text`. (If no type is
given it will default to `string`.)

```
$ geddy gen scaffold user name:default
```

This example creates scaffolding but includes `name` as the default property
that will be used when displaying the content in the views.

In this example the property `name` is given the type `string` because no type
was given. You could have also written `name:string:default` (or some other type
in place of 'string'). If no default property is given Geddy will use `id` as
the default display property.

Note: the id property is *always* created, and managed internally by Geddy's
ORM.

### Building an app

This will be a short tutorial as scaffolded resources make things incredibly
easy. First we'll create our application -- this will create a base that we can
start on:

```
$ geddy gen app to_do
```

Let's spend some time reviewing what Geddy did. The previous command created a
lot.

During the tutorial we will edit and review some of these files, but we'll
briefly explain what they are now so you get familiar with the base application
layout.

-   `app/controllers`: contains the base controller and the main
    controller. All controllers will go in this folder
-   `app/models`: Models you create will go in this folder
-   `app/views`: All templates for rendering views go here
-   `app/views/layouts/application.html.ejs`: layout used by default by
    all the views
-   `app/views/main/index.html.ejs`: main view displayed when you visit
    the root of your web application
-   `app/views/errors/not_found.html.ejs`: used to render 404 error pages
-   `app/views/errors/default.html.ejs`: used to render all other error pages
-   `config/development.js`: configuration for the development
    environment
-   `config/environment.js`: configuration for all your environments
-   `config/init.js`: this is where you write code that will be run only
    once your app starts.
-   `config/production.js`: configuration for the production environment
-   `config/router.js`: contains route settings. It has some examples
    and you can learn more about [routes from the
    Wiki.](https://github.com/mde/geddy/wiki/Using-the-Router)
-   `public/`: contains static assets that will be served directly by
    Geddy's server
-   `public/css/`: Geddy uses [twitter
    bootstrap](http://twitter.github.com/bootstrap/). These are
    referenced by the layout file (`application.html.ejs`)
-   `public/img/`: contains a few images used by twitter bootstrap. Your
    images will usually go here as well
-   `public/js/`: bootstrap and jquery scripts
-   `lib`: Reusable libs for your app can go here
-   `log`: Your app writes logs to this folder
-   `node_modules`: Node modules your app depends on will be installed
    here by `npm install`.
-   `package.json`: Defines all the important info about your app
-   `test`: Tests for your app go here. Always write tests
-   `Jakefile` Used for defining the various build tasks for your app

Now from your app's root, simply start Geddy

```
$ cd to_do
$ geddy
```

Then open your browser and navigate to [localhost:4000](http://localhost:4000/),
and you'll find the hello world page.

#### Optional: check out your app on a mobile phone

-   Open up your favorite phone simulator and go to
    [http://localhost:4000](http://localhost:4000)
-   OR resize your browser to at most 480px wide
-   OR set your app to listen on an external IP address
    and use your actual phone

### Check out the config

Look in the config directory -- the development.js file is the one that
interests us here now, because we'll be working in 'development' mode, and this
file is what the server uses for its configuration when starting that
environment up.

Here's the contents:

```
var config = {
  detailedErrors: true
, debug: true
, hostname: null
, port: 4000
, model: {
    defaultAdapter: 'filesystem'
  }
, sessions: {
    store: 'memory'
  , key: 'sid'
  , expiry: 14 * 24 * 60 * 60
  }
};
```

You can see the default Model adapter is the Filesystem adapter. That means
we're just writing stuff to a flat file, and you don't need to install any DB to
play around with Geddy.

In the prodution environment, you'll likely be using an actual DB like Postgres
or MongoDB.

### Create a resource

So now we want to create a resource for our ToDo items. We will create a
'title' and 'status' property so that we have some attributes to use.

```
$ geddy gen scaffold to_do title:default status
```

After this, you have to restart Geddy to pick up the newly created files.

```
$ geddy
```

Open your browser to [localhost:4000/to_dos](http://localhost:4000/to_dos)
and you'll get a list of the to_dos which should be empty.

Go ahead and look around, you can create show edit and delete to_do items. We're
going to make a few changes though.

#### Add validation

The first thing we'll do is to add some validation to our ToDo model. So open
'app/models/to_do.js' in your editor and add the following lines anywhere inside
the constructor function

```
var ToDo = function () {
...
  // Add this inside the constructor function
  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  }, {message: "Status must be 'open' or 'done.'"});
...
};
ToDo = geddy.model.register('ToDo', ToDo);
```

Here we are making it so the title property is required and have a minumum of 5
characters. We also made it so the status acts like a boolean attribute but uses
custom names instead of true/false. The 'message' property passed in the opts
sets the error message that will show in the flash-message when an item fails
validation.

We will later also change our `edit` and `add` views to limit the options, but
for now we will leave the views the way they are.

The auto process-restart for development-mode should pick up the changes we've
just made, so go and play with the app again.

Create a few ToDo items, try to edit them, and test the validation rules. When
an item can't be saved because it's not valid, you'll see an error message on the
page in the session flash.

[Click here](http://geddyjs.org/reference#controllers.flash) to learn more about
the session flash.

We've got a good ToDo application running and didn't really have to do much.
Scaffolding is very good when you need something simple to get you started.

### Create an association

Now we're going to create another resource, and relate it to our ToDos.

Let's say that a ToDo has a number of steps to finish before the ToDo can be
completed. Let's scaffold out our Step resource.

```
$ geddy gen scaffold step title:default description:text status
```

That creates the same sort of scaffolded resource we saw with ToDos.

#### Add validation for Steps

Now we can create Steps to link to a particular ToDo. Let's quickly add some
validation to ensure each Step has at least a 'title'. Add this to your Step
model (app/models/step.js):

```
var Step = function () {
...
  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  }, {message: "Status must be 'open' or 'done.'"});
...
};
Step = geddy.model.register('Step', Step);
```

Exactly the same validation for our ToDos.

#### Create the association

Now, let's make the changes to our models to create the association between
them.

Add the following line inside your ToDo model:

```
var ToDo = function () {
...
  this.hasMany('Steps');
...
};
ToDo = geddy.model.register('ToDo', ToDo);
```

This is pretty straighforward, but it basically means that a ToDo can have
multiple Steps associated with it.

Add the following line inside your Step model:

```
var Step = function () {
...
  this.belongsTo('ToDo');
...
};
Step = geddy.model.register('Step', Step);
```

This is pretty simple too -- it says that each Step is owned by a ToDo.

### Displaying the association

Now you can restart Geddy to pick up the new Step files, and navigate to
[http://localhost:4000/steps](http://localhost:4000/steps) to see the empty list
for Steps.

When you click the "Create a new Step" button, you can see the expected Title
and Description fields, but no way to link them with any of the ToDo items we
created earlier. Let's fix that.

When we handle the 'add' action (later, the 'edit' action as well) for a Step,
we need to load the list of ToDos, so we can dump them into a select box we can
use to choose the ToDo for the Step.

#### Retrieve the ToDos

Open up the Step controller: app/controllers/steps.js, and look at the 'add'
action (`this.add`, just a method on the controller).

Use the `all` method on Geddy's ORM to load all the ToDos you've made so far,
before rendering out the 'edit' page, like this:

```
  this.add = function (req, resp, params) {
    var self = this;
    geddy.model.ToDo.all(function (err, data) {
      if (err) {
        throw err;
      }
      self.respond({params: params, toDos: data});
    });
  };

```

What did we do here? We grabbed all the ToDo items we've created, and in the
callback, rendered our 'edit' action, passing the items (`data`) to the response
as the `toDos` param. Because we're grabbing all the ToDos, we're only passing a
callback and no query object to the `all` call. We want *everything*.

Remember, this callback is an asynchronous function, so you need to declare a
`self` variable to keep a reference to the controller instance so you can call
`respond` on it.

#### Pass the data to the form

Now we need to pass this data to the form we use to create a Step. Open up
app/views/steps/add.html.ejs, and you'll see that the actual form is rendered as
a partial. This lets us share the same form between the add and the edit
actions.

We need to pass this list of ToDos down into the partial. Where you see the call
to `partial`, make the code look like this:

```
<%- partial('form', {step: params, toDos: toDos}) %>
```

The params you pass in the object literal that is the second arg will become
local variables in the rendered partial template.

#### Display the ToDos in a select element

Let's open up the partial template now, app/views/steps/form.html.ejs. We're
going to dump the list of ToDos we retrieved in the controller into a select
tag.

Geddy has a handy helper for this that takes away a lot of the grunt work,
called `selectTag`, as well as a bunch of other nice helpers.

You can find the [docs for the helpers
here](http://geddyjs.org/reference#helpers).

Just inside the container div with the class 'control-group', add this code:

```
  <label for="toDoId" class="control-label">To-Do for this step</label>
  <div class="controls">
    <%- selectTag(toDos, step.toDoId, {
      name: 'toDoId'
    , valueField: 'id'
    , textField: 'title'
    , class:'span6'
    }); %>
  </div>
```

What did we do here? We just passed the list of ToDos to the `selectTag` helper,
telling it the 'name' attribute for the select elements should be 'toDoId'.
(This will be the foreign key used by each Step to link itself back to a ToDo.)

We also set a `valueField` and `textField`, telling the helper to use the 'id'
property of each ToDo as the value of its option element, and the Step's 'title'
as the text displayed.

You can see that in the second param of this call, we're passing `step.toDoId`
-- this specifies what option element should be preselected. We're not using
this yet, but it will come into play when we begin editing Steps.

Refresh your 'Create a new Step' page, and you should see a select box at the
top with all your ToDos in it.

##### Working with Handlebars

Using helpers like selectTag in Handlebars works differently as compared to 
EJS. Since you cannot pass JSON as an argument, you will have to pass JSON 
arguments from the controller.

Inside the `all` method on Geddy's ORM, include the selectTag helper options:

```
  this.add = function (req, resp, params) {
    var self = this;
    geddy.model.ToDo.all(function (err, data) {
      if (err) {
        throw err;
      }
      self.respond({params: params, 
        toDos: data,
        selectOpts: 
          name: 'toDoId', 
          valueField: 'id', 
          textField: 'title'
        }});
    });
  };
```

As opposed to the EJS example above, you need not change the scaffolded code 
in app/views/steps/add.html.hbs because all the arguments are automatically 
passed so leave the code like this:

```
  {{{partial "form" this}}}
```

And lastly, the selectTag helper in app/views/steps/form.html.hbs would look 
like this:

```
  {{#selectTag toDos step.toDoId selectOpts}}{{/selectTag}}
```

#### Save your Step

Select a ToDo for this step, and save it. If you remembered to add a title and a
valid status, and it passes validation, you should be redirected to the scaffold
page displaying the new Step.

Verify that the association got added correctly by checking to see if your new
Step has a toDoId -- this should correspond to the id of the associated ToDo.

#### Editing Steps

Right now, if you try to edit one of your existing steps, the page will blow up
in your face, because the form isn't getting the `toDos` variable passed in (so
it's 'undefined').

We basically have to go through the same set of steps for the 'edit' action.
Open up your Step controller, and changed the edit action to look like this:

```
  this.edit = function (req, resp, params) {
    var self = this;
    geddy.model.Step.first(params.id, function(err, step) {
      if (err) {
        throw err;
      }
      if (!step) {
        throw new geddy.errors.BadRequestError();
      }
      else {
        geddy.model.ToDo.all(function (err, data) {
          if (err) {
            throw err;
          }
          self.respond({step: step, toDos: data});
        });
      }
    });
  };
```

IMPORTANT: Notice we've replaced the `respondWith` method call here with the
lower-level `respond`. The `respondWith` method is very handy when all you have
is a model instance, but in this case we're passing along some other data, and
we need to drop down to the lower-level `respond' method.

[Click here](http://geddyjs.org/guide#responding) to learn more about the
various ways to respond to a request.

Now open the corresponding view (app/views/steps/edit.html.ejs), and pass the
`toDos` into the partial call, like so:

```
<%- partial('form', {step: step, toDos: toDos}) %>
```

Go ahead and create a few more Steps, and link them to the same ToDo. We still
have to take care of the other side of the association -- displaying all the
Steps for a ToDo.

### The ToDo-side of the association

It's a similar process for the ToDo side. We need to open the ToDo controller
(app/controllers/to_dos.js), and update the 'show' action to get all the
associated Steps for a particular ToDo.

Change the code to look like this:

```
  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.ToDo.first(params.id, function(err, toDo) {
      if (err) {
        throw err;
      }
      if (!toDo) {
        throw new geddy.errors.NotFoundError();
      }
      else {
        toDo.getSteps(function (err, data) {
          self.respond({toDo: toDo, steps: data});
        });
      }
    });
  };
```

Notice this action called the `first` action to look up the first ToDo that
matches the desired id. Once we have the ToDo, we can call `getSteps` on it to
look up all the associated Steps. This is a convenience method Geddy provides
automatically based on the associated model. If we had given ToDo a `hasMany` of
the Zoobie model, Geddy would automatically make a `getZoobies` method to fetch
them.

IMPORTANT: We also have to do the same thing as before, with the 'update' action
for the Step: change the `respondWith` method to `respond` so that we can pass
the extra data of the retrieved Steps to the view.

Now open the 'show' view (app/views/to_dos/show.html.ejs), and add some code to
print them out for each ToDo.

The built-in code that just iterates over properties on the object is nice to
verify your item is actually saved, but it's not very practically useful. Remove
that section in the bottom half of the code in the template (ignore the
'hero-unit' navigation section at the top), and replace it with this:

```
<h3>Status: <%= toDo.status %></h3>

<h3>Steps</h3>
<% steps.forEach(function (step) { %>
<h4>
  <%- linkTo(step.title, {controller: 'steps', action: 'show', id: step.id}); %>
</h4>
<% }); %>
```

What did we just do? We just iterated over the list of Steps returned by the
lookup in the controller, and printed out a link for each one, with the title of
the Step as the anchor text, and the correct URL for navigating to the 'show'
action for that Step.

### API

Check these urls out in your browser:

-   GET: `localhost:4000/to_dos.json`
-   GET: `localhost:4000/to_dos/:id.json`
-   POST: `localhost:4000/to_dos`
-   PUT: `localhost:4000/to_dos/:id`

### Conclusion

At this point you should have a working To-Do List app!

If you want to explore a little more, here are some other things you
could do:

-   Change the `Main#index` route to point to the `ToDos#index` action
    (hint, check out `config/router.js`)
-   Add some logging with `geddy.log`
-   Configure mongo, riak or postgres and use it instead of the memory
    modelAdapter. See how easy it's to switch

### Next: Eager-fetch associations (SQL adapters)

Up to now we've just been using the built-in Filesystem adapter Geddy defaults
to using in development mode. This just takes the JSON of the objects created,
and dumps them in a flat file in your application directory (_datastore.json).

This adapter behaves very similarly to MongoDB, Riak, or LevelDB in that it's
'non-relational.' It doesn't know anything about the relationships between items
in the datastore. This is fine for some types of applications, and gives you a
lot of flexibility, not requiring you to know quite as much about the structure
of your data before you begin developing.

#### Relational datastores

But using a relational datastore -- like a SQL database -- allows you to do
certain things you can't do with a non-relational store. The main ability you
get is the ability to 'eager fetch' a list of associations.

This means that with our previous example, you would be able to fetch all the
ToDos, and their associated Steps in one go, instead of getting the ToDos, and
having to iterate over them to get all the Steps. (This is sometimes called the
'N plus 1 problem,' because you have one query to fetch your main items, then
'N' more queries, one for each item.)

#### Setting the DB

In an actual production app, you'd be using a relational database like
PostgreSQL or MySQL, but for this tutorial, we'll just continue using
development mode, and use SQLite. It's installed already on all Macs, and it's
easy to install on other platforms. If you don't have it, install it.

Then, open up the development config (config/development.js), and you'll see a
bunch of different possible DB configurations. In the 'model' section, set
'defaultAdapter' to 'sqlite'. (You don't need any 'db' section for configuring
the database when you're using SQLite.)

If you start up your app app now, it will blow up at this point, because you
need to install the correct SQLite library for Node, for Geddy's ORM to use, and
initialize the database.  Use this command:

```bash
$ geddy jake db:init
```

What did this do? Geddy uses Jake (https://github.com/mde/jake) as a build-tool
for lots of its internal scripting tasks. This tells Geddy's bundled Jake to
initialize the DB specified in your production config file. This does a couple
of things:

- Installed the correct SQLite lib for Node
- Creates a Migrations table

#### Migrations

What are Migrations? Migrations are used with SQL DBs to manage the schema over
time. It's very similar to versioning your programming code with an RCS
('revision control system') like Git or Subversion.

[Click
here](http://geddyjs.org/guide#modelsMigrations%20%28SQL%20adapters%20only%29)
to learn more about how Geddy's migrations work.

To create the tables needed by your models, you'll need to run the migrations
that were initially created when you scaffolded out your models.

Run the migrations like this:

```bash
$ geddy jake db:migrate
```

We'll also need to create the columns needed by the association we created
between ToDos and Steps. Since Steps all belong to a ToDo, we'll need to add a
column for the `toDoId` property on a Step used to link back to a particular
ToDo.

Create a blank migration by running this command:

```bash
$ geddy gen migration create_to_do_step_association
[Added] db/migrations/20131111135707create_to_do_step_association.js
```

This creates a blank migration you can fill in. Open the generated migration
file, and add or remove the command for adding your foreign-key column:

```
var CreateToDoStepAssociation = function () {
  this.up = function (next) {
    this.addColumn('steps', 'toDoId', 'string', function (err, data) {
      if (err) { throw err; }
      next();
    });
  };

  this.down = function (next) {
    this.removeColumn('steps', 'toDoId', function (err, data) {
      if (err) { throw err; }
      next();
    });
  };
};

exports.CreateToDoStepAssociation = CreateToDoStepAssociation;
```

Run this migration, like so:

```bash
$ geddy jake db:migrate
```

Then start up your app, and navigate to
[http://localhost/to_dos](http://localhost/to_dos). Verify that things work correctly
-- create some ToDos, and some Steps, and associate each step with a ToDo.

If you want to rollback (down) to a specific version, provide the version number:
```bash
$ geddy jake db:migrate[1392335995]
```

#### Doing the eager-fetch of Steps

Now we'll add the code that fetches all associated Steps along with the list of
ToDos loaded in the 'index' view of ToDos.

Just specify the association you want to include in the query, using the
'includes' property on the query opts.

Change the 'index' action on the ToDo controller (app/controllers/to_dos.js) to
look like this:

```
  this.index = function (req, resp, params) {
    var self = this;

    geddy.model.ToDo.all({}, {includes: 'steps'}, function(err, toDos) {
      if (err) {
        throw err;
      }
      self.respondWith(toDos, {type:'ToDo'});
    });
  };
```

We're passing the name of the association to eager-fetch in the 'includes'
property of the query -- notice we now have to pass an empty query-object to the
query, to allow us to pass options as a second arg.

Note that there's no calling `getSteps` on any of the returned objects, as the
query generated uses a SQL JOIN to load the associated Step objects directly in
the same query. All the Steps associated with each ToDo will be found on a
`steps` property on the ToDo item.

Now let's open up the list view (app/views/to_dos/index.html.ejs) to render out
these Steps inline with the list of ToDos.

Get rid of the div that's displaying the id of the ToDo item. We don't need
that. Replace the entire bottom section of the code with this:

```
<div id="toDos-list">
<% if (toDos) { %>
  <% for (var i = 0, ii = toDos.length; i < ii; i++) { %>
    <div class="row list-item" id="toDo-<%= toDos[i].id; %>">
      <div class="span12">
        <h3><%- linkTo(toDos[i].title, toDoPath(toDos[i].id)); %></h3>
        <% var steps = toDos[i].steps || [];
          steps.forEach(function (step) { %>
            <div>
              <%= step.title %>
            </div>
          <%
          });
        %>
      </div>
    </div>
  <% } %>
<% } %>
</div>
```

What does this code do? It adds a section underneath the title of each ToDo that
renders the list of any Steps associated with it. It will do this for the entire
list of ToDos, without you having to iterate on them, and run a
query to fetch the Steps. This is the advantage that eager-fetch of associations
gives you.



