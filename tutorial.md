### Introduction

In this tutorial we'll learn how to use Geddy by creating a simple To-Do
Manager applciation.

#### In this tutorial we'll cover:

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
commands from the CLI.  If no commands are given, Geddy will start up the server.
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
directory.  You must include a name.

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

`resource <name> [model attributes]`: Create a plain resource.

`resource` takes one or more arguments: a name, followed by a set of model
properties. You can specify the datatype for the property after a colon (e.g.,
foo:string or bar:number).

Simple resources include a model, REST routes, a controlle with minimal CRUD
actions. It does not include views.

`controller <name>`: Generates a bare controller.

`controller` takes a single argument: a name.

A bare controller includes a controller, REST routes, and an index view.

If you also include the options `--swig`, `--jade`, `--handle`
or `--mustache` you can substitute the template language to your liking.

`model <name> [model attributes]`: Generate a new model.

`model` takes one or more arguments: a name, followed by a set of model
properties. You can specify the datatype for the property after a colon (e.g.,
foo:string or bar:number).

Generating models this way will only create a model file, and nothing else.

#### Model properties

There are a three commands (`scaffold`, `resource`, `model`) that also include
model property arguments. This is a list seperated by spaces that include the
property, its datatype and an optional flag for setting the 'default' property.

[Click here](http://geddyjs.org/guide#modelsDefining%20models) to see how Geddy
models are defined, and what datatypes are supported.

Here are some examples of how model properties are added:

```
$ geddy gen scaffold frang title:string description:text
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

Note: the id property is *always* be created, and managed internally by Geddy's
ORM.

### Building an app

This will be a short tutorial as scaffolded resources make things incredibly
easy. First we'll create our application --this will create a base so we can
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
-   `app/view`: All templates for rendering views go here
-   `app/views/layouts/application.html.ejs`: layout used by default by
    all the views
-   `app/views/main/index.html.ejs`: main view displayed when you visit
    the root of your web application
-   `app/views/errors/not_found.html.ejs`: used to render 404 rror pages
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
    geddy's server
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
-   `package.json` Defines all the important info about your app
-   `test` Tests for your app go here. Always write tests
-   `Jakefile` Used for defining the various build tasks for your app

Now from your app's root, simply start geddy

```
$ cd to_do
$ geddy
```

Then open your browser and navigate to [localhost:4000](http://localhost:4000/),
and you'll find the hello world page.

So now we want to create a scaffold to manage our to-do items. We will
create a 'title' and 'status' property so that we have some attributes to
use.

```
$ geddy gen scaffold to_do title:default status
```

We are almost done. Now you have to restart geddy

```
$ geddy
```

Open your browser to [localhost:4000/to_dos](http://localhost:4000/to_dos)
and you'll get a list of the to_dos which should be empty. Go ahead and
look around, you can create show edit and delete to_do items. We're going
to make a few changes though.

The first thing we'll do is to add some validation to our ToDo model. So
open 'app/models/to_do.js' in your editor and add the following lines
anywhere inside the constructor function

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
exports.ToDo = ToDo;
```

Here we are making it so the title property is required and have a
minumum of 5 characters. We also made it so the status acts like a boolean
attribute but uses custom names instead of true/false.

We will later also change our `edit` and `add` views to limit the options, but
for now we will leave the views the way they are.

The auto process-restart should pick up the changes we've just made, so go and
play with the app again. Create a to-do item, try to edit and test the
validation rules. We've got a good to-do application running and didn't really
have to do much. Scaffolding is very good when you need something simple to get
you started.

#### Optional: check out your app on a mobile phone

-   Open up your favorite phone simulator and go to
    [http://localhost:4000](http://localhost:4000)
-   OR resize your browser to at most 480px wide
-   OR set your app to listen on an external IP address
    and use your actual phone

### Resource

Now, let's get started building our To Do list manager. First, we'll
need to generate the `to_do` resource. We do this using the `geddy gen`
command as well:

```
$ geddy gen resource to_do title:string status
```

What did that do?

-   It generated a `to_do` model including the given model properties
-   It generated a `to_dos` controller
-   It created a `to_dos` view directory. Please note the folder is empty
    since resource won't generate any views for you.
-   It generated these routes from a resource route:
    -   `/to_dos` (GET)
    -   `/to_dos` (POST)
    -   `/to_dos/add` (GET)
    -   `/to_dos/:id/edit` (GET)
    -   `/to_dos/:id` (GET)
    -   `/to_dos/:id` (PUT)
    -   `/to_dos/:id` (DELETE)

### Views

To start creating our views, create a few files in `app/views/to_dos`,
those being:

-   `_form.html.ejs`
-   `add.html.ejs`
-   `edit.html.ejs`
-   `index.html.ejs`
-   `show.html.ejs`

We won't go into to much detail here, as it should be pretty self-explanatory
but I'll go through some things.

First we'll create the `_form.html.ejs` partial template, this will hold
all the form data for edit and add actions .

```
<%
  var isUpdate = params.action == 'edit'
    , formTitle = isUpdate ? 'Update this To Do Item' : 'Create a new To Do Item'
    , action = isUpdate ? to_doPath(params.id) + '?_method=PUT' : to_dosPath
    , deleteAction = isUpdate ? to_doPath(params.id) + '?_method=DELETE' : ''
    , btnText = isUpdate ? 'Update' : 'Add'
    , doneSelectAttributes = isUpdate && to_do.status === 'done' ? "selected=true" : ''
    , openSelectAttributes = isUpdate && to_do.status === 'open' ? "selected=true" : ''
    , titleValue = isUpdate ? to_do.title : ''
    , errors = params.errors;
%>
<form id="to_do-form" class="form-horizontal" action="<%= action %>" method="POST">
  <fieldset>
    <legend><%= formTitle %></legend>
    <div class="control-group">
      <label for="title" class="control-label">Title</label>
      <div class="controls">
        <%- contentTag('input', titleValue, {type:'text', class:'span6', placeholder:'enter title', name:'title'}) %>
        <%  if (errors) { %>
          <p>
          <% for (var p in errors) { %>
            <div><%=  errors[p];  %></div>
          <% } %>
          </p>
        <% } %>
      </div>
    </div>
    <% if (isUpdate) { %>
      <div class="control-group">
        <label for="status" class="control-label">Status</label>
        <div class="controls">
          <select name="status" class="span6">
            <option <%=openSelectAttributes%>>open</option>
            <option <%=doneSelectAttributes%>>done</option>
          </select>
        </div>
      </div>
    <% } %>
    <div class="form-actions">
      <%- contentTag('input', btnText, {type: 'submit', class: 'btn btn-primary'}) %>
      <% if (isUpdate) { %>
        <%- contentTag('button', 'Remove', {type: 'submit', formaction: deleteAction, formmethod: 'POST', class: 'btn btn-danger'}) %>
      <% } %>
    </div>
  </fieldset>
</form>
```

Here we created a couple variables so we can tell if it's for a edit or
add action, then if we have any errors we dislay them. Also we are using
a couple view helpers (contentTag) which are helpful with dealing with
assets, links, etc. You can read more about our view helpers
[here](https://github.com/mde/geddy/wiki/View-Helpers).

Now that we've created a base for our add and edit actions, we'll do
them now. They're simple they just use the \_form partial. Add the
following code to `add.html.ejs`

```
<div class="hero-unit">
  <%= partial('_form', {params: params}); %>
</div>
```

The edit view is slightly different because we will need to pass the
to_do object to the partial. Modify `app/views/to_dos/edit.html.ejs` with
the following code:

```
<div class="hero-unit">
  <%= partial('_form', {params: params, to_do: to_do}); %>
</div>
```

Now that we have views that will create to_do items let's add a simple
`show.html.ejs` just so we can test everything end to end. In the
following code I just loop through the params.

```
<div class="hero-unit">
  <%- linkTo('Edit this to_do', editToDoPath(params.id), {class: 'btn pull-right'}); %>
  <h3>Params</h3>
  <ul>
  <% for (var p in to_do) { %>
    <li><%= p + ': ' + params[p]; %></li>
  <% } %>
  </ul>
</div>
```

Finally we need to create the index action to link everything together.

```
<div class="hero-unit">
  <h2>To Do List</h2>
  <%- linkTo('Create a new To Do', addToDoPath, {class: 'btn pull-right'}) %>
</div>
<% if (to_dos && to_dos.length) { %>
  <% for (var i in to_dos) { %>
  <div class="row to_do-item">
    <div class="span8">
        <h3><%- linkTo(to_dos[i].title, to_doPath(to_dos[i].id)) %></h3>
    </div>
    <div class="span4"><h3><i class="icon-list-alt"></i><%= to_dos[i].status; %></h3></div>
  </div>
  <% } %>
<% } %>
```

For the index action we just have a link to add new items, and a list of
all the items, with a link to each of their edit paths. If you notice
we're using special helpers here, that create links to the path
specified.

### Model

We're ready to start in on modeling our data. Geddy provides us with
some pretty cool tools to do this:

-   Validation
-   Typed Data
-   Instance Methods
-   Static Methods

These tools should look somewhat familiar to anyone who's used an
ORM-system like Ruby's ActiveRecord, or DataMapper.

Go ahead and open up `app/models/to_do.js`. Read through the commented
out code there for some ideas on what you can do with models. We'll be
writing our model from scratch for this tutorial, so let's leave that
commented out.

So, minus the commented out code, you should have a file that looks like
this:

```
var ToDo = function () {

  this.defineProperties({
      title: {type: 'string'}
    , status: {type: 'string'}
  });

};

exports.ToDo = ToDo;
```

The `defineProperties` method takes any number of properties to be added
to the model. The keys in the object will be added as properties on the
model. The values are just objects that describe the properties. When we
ran the scaffold command it created these for us. But we want to change
it so they are all \`required\`. To learn more, check out the
[readme](https://github.com/mde/geddy/blob/master/README.md).

There's also a more detailed validation API. While we're here, let's add
some validation as well. The final code should look like this:

```
var ToDo = function () {

  this.defineProperties({
      title: {type: 'string'}
    , status: {type: 'string'}
  });
  
  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  });
};

exports.ToDo = ToDo;
```

For the `title` property, we made sure that the property is always
present and we made sure that the `title` property is a minimum of 5
characters long.

For the `status` property, we used a function to validate that the
property is always set to either `open` or `done`.

For more information about Geddy's Models, you can check out the [Model
wiki page](https://github.com/mde/geddy/wiki/Models).

#### Model-adapter

Now that we've set up our `to_do` model, we need to define a way to store
it. To keep our models persistance agnostic, Geddy uses model-adapters.
By default it will store objects in memory using the `memory` model
adapter. You can change the default memoryAdapter in
`config/development.js`.

```
defaultAdapter: 'memory'
```

Now we've got a place to store our `to_do`'s. This is in your
application's memory, so it will disappear when you restart the server.

#### Optional: use mongo for persistence

Install a [mongodb](http://www.mongodb.org/downloads) server if you
haven't already and ` $ [sudo] npm install mongodb-wrapper` to
install the required mongodb-wrapper and set `defaultAdapter = 'mongo'`
in config/development.js instead of the memory adapter. You will also
have to specify the db configuration
`db: { mongo: { dbname: 'model_test' }`. For more information see the
[Model API reference](/documentation#models)

### Controller

Controllers sit between the views and models. They are also the entry
point of our code. When a user gets a page a function in a controller,
also called a controller acton, will get invoked. The controller will
usually interact with the model and pass it to the view. The pattern
isn't as black and white, but for the purpose of the tutorial, let's
move on to actually write some controller actions.

#### Saving to_dos

To save a to_do we need to edit the `create` action in
`app/controllers/to_dos.js`. It's not doing much at the momment so lets
modify it a little bit.

```
this.create = function (req, resp, params) {
  var self = this
    , to_do = geddy.model.ToDo.create({title:params.title, status:'open'});

  to_do.save(function(err, data) {
    if (err) {
      params.errors = err;
      self.transfer('add');
    } else {
      self.redirect({controller: self.name});
    }
  });
};
```

First, we create a new instance of the `ToDo` model with
`geddy.model.ToDo.create`, passing in the title that our form will post
up to us, and setting up the default status.

Then we call we call the `save` method. Internally, save does two
things. It validates the model based on the rules we defined earlier.
This is similar to calling `to_do.isValid()`. If the model was valid, it
will delegate to the model adapter configured previously to actually
persist the model. If either step fails, you will get an error
collection as the first parameter of the function and we redirect the
user back to the /to_dos/add route. Otherwise we redirect to the
controller's default action `self.redirect({controller: self.name});`.

#### Listing all to_dos

Now that we we can create To Do items, we should probably list them
somewhere. Lets change the `index` action in the `to_dos` controller.

Open up `/app/controllers/to_dos.js` again and replace the current
implementaton with the following code.

```
this.index = function (req, resp, params) {
  var self = this;

  geddy.model.ToDo.all(function(err, to_dos) {
    self.respond({params: params, to_dos: to_dos});
  });
};
```

This part is a bit simpler and it follows a similar pattern. Instead of
calling create in `geddy.model.ToDo` this time we simply call `all` and
we pass the data back to the view for rendering

Now that we can can load to_do items you can test it by starting up Geddy
and going to [localhost:4000/to_dos](http://localhost:4000/to_dos) and you
can view the list of items.

#### Showing a to_do

Now that we have our index action working as expected, we should work on
the `show` controller action to display to_do details.

```
this.show = function (req, resp, params) {
  var self = this;

  geddy.model.ToDo.load(params.id, function(err, to_do) {
    self.respond({params: params, to_do: to_do});
  });
};
```

Now we have a working show action in the controller to load items.

#### Updating a to_do

Alright, now that we can view our to_dos let's edit the `update` and
`edit` actions in the `to_dos` controller. They should look something
like this:

```
this.edit = function (req, resp, params) {
  var self = this;

  geddy.model.ToDo.load(params.id, function(err, to_do) {
    self.respond({params: params, to_do: to_do});
  });
};

this.update = function (req, resp, params) {
  var self = this;

  geddy.model.ToDo.load(params.id, function(err, to_do) {
    to_do.updateAttributes(params);

    to_do.save(function(err, data) {
      if (err) {
        params.errors = err;
        self.transfer('edit');
      } else {
        self.redirect({controller: self.name});
      }
    });
  });
};
```

#### Deleting a to_do

The delete is really simple specially now that you're familiar with the
pattern. This time you will have to call remove passing the id of the
to_do you want to delete. We will leave the details as an excercise.
Remember that you can always compare your solution to the [final
version](https://github.com/mde/geddy/tree/master/examples/to_do_app).


### API

Check these urls out in your browser:

-   GET: `localhost:4000/to_dos.json`
-   GET: `localhost:4000/to_dos/:id.json`
-   POST: `localhost:4000/to_dos`
-   PUT: `localhost:4000/to_dos/:id`

### Conclusion

At this point you should have a working To Do List app!

If you want to explore a little more, here are some other things you
could do:

-   Change the `Main#index` route to point to the `ToDos#index` action
    (hint, check out `config/router.js`)
-   Add some logging with `geddy.log`
-   Configure mongo, riak or postgress and use it instead of the memory
    modelAdapter. See how easy it's to switch
