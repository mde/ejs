### Introduction

In this tutorial we'll learn how to use Geddy by creating a simple todo
manager applciation. We will create two applications one using
scaffolding and one using resources. See the [finished
version](https://github.com/mde/geddy/tree/master/examples/todo_app).

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

#### Using the `geddy gen` command

Now that we have Geddy installed we need to learn how to use its generator
commands from the CLI.  If no commands are given, Geddy will start up the server
(if you're inside a Geddy application -- otherwise it will show the help
dialog). But if you give Geddy the `gen` command, it can be used to create
applications or resources for applications.

#### `geddy gen` commands:

-   `app <name>`: Create a new Geddy application
-   `resource <name> [model attributes]`: Create a new Geddy resource.
    Resources include a model, controller and a route
-   `scaffold <name> [model attributes]`: Creates a new Geddy
    scaffolding. Scaffolding includes everything Resources have as well
    as views
-   `secret`: Generate a new application secret in
    \`config/environment\`
-   `controller <name>`: Generate a new controller including an index
    view and a route
-   `model <name> [model attributes]`: Generate a new model
-   `console`: opens a console in the context of geddy

#### Options:

-   `--swig`: When generating views, use Swig templates(Default:
    EJS)
-   `--jade`, `-j`: When generating views, use Jade templates(Default:
    EJS)
-   `--handle`, `-H`: When generating views, use Handlebars
    templates (Default: EJS)
-   `--mustache`, `-m`: When generating views, use Mustache
    templates (Default: EJS)

#### How to use Geddy's generator commands

Each of Geddy's generator commands (e.g., `app`, `resource`, `controller`, etc.)
takes an or set of arguments (excluding `secret` and `console`). Here we'll
learn how to use those.

-   `app` takes a single argument being the name you'd like, then it
    will generate a base application. If no name is given the command
    will fail.
-   `secret` doesn't take any arguments, it will find your
    `config/environment` file and create a new application secret in it,
    deleting any other secret.
-   `controller` takes a single argument being a name. It will create a
    new controller, a route and an index view. If you also include the
    options `--swig`, `--jade`, `--handle` or `--mustache` you can substitute the
    template language to your liking.
-   `model` takes one or more arguments, the first being a name and the
    others being a set of model properties. We won't go over model
    properties right now but you can learn about them in the next
    section. This will create a new model including the model properties
    given.
-   `resource` takes one or more arguments, the first being a name and
    the others being a set of model properties. This will create a
    controller, a model including the given model properties and a
    resource route.
-   `scaffold` takes one or more arguments, the first being a name and
    the others being a set of model properties. Scaffolding includes a
    controller, a model including the given model properties as well as
    a default model adapter a resource route and will create all views.
    If you also include the options `--swig`, `--jade`, `--handle` or `--mustache`
    you can substitute the template language to your liking.

#### Model properties

There are a three commands (`resource`, `model` and `scaffold`) that also
include model property arguments. This is a list seperated by spaces
that include the property, its type and an optional default setting.
Below are some examples of how they are used in the commands.

```
$ geddy gen scaffold user name:string
```

The example above will create our normal scaffolding and include a
`name` property of type `string`. If no type is given it will default to
`string`.

```
$ geddy gen scaffold user name:default
```

This example creates scaffolding but includes `name` as the default
property that will be used when displaying the content in the views. In
this example the property `name` is given the type `string` because no
type was given, you could of also writte `name:string:default`, or you
could've used a different type of course. The `default` setting also
includes an alias called `def`. If no default property is given Geddy
will use `id` as the display property.

```
$ geddy gen scaffold user name:default id:int
```

This time we used `name` type `string` as the default property. We also
overwrote the included `id` property with a different type (by default
it's a string).

Note: an ID property will *always* be created.

### With scaffolding

This will be a short tutorial as scaffolding will do almost everything
for us, I won't go into detail on what it does as it will be covered in
exstensive detail in the [resources tutorial](#resource). The source
for this tutorial can be found
[here](https://github.com/mde/geddy/tree/master/examples/todo_app).

First we'll create our application, this will create a base so we can
start on.

```
$ geddy gen app todo_app
```

Let's spend some time reviewing what Geddy did. The previous command
created a lot. During the tutorial we will edit and review some of these
files, but we'll briefly explain what they are now so you get familiar
with the base application.

-   `app/controllers`: contains the base controller and the main
    controller. All controllers will go in this folder
-   `app/views/layouts/application.html.ejs`: layout used by default by
    all the views
-   `app/views/main/index.html.ejs`: main view displayed when you visit
    the root of your web application
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

Now from your app's root simply start geddy

```
$ cd todo_app
$ geddy
```

Then open your browser and navigate to [localhost:4000](http://localhost:4000/),
and you'll find the hello world page.

So now we want to create a scaffold to manage our todo items. We will
create a title and status property so that we have some attributes to
use.

```
$ geddy gen scaffold todo title:default status
```

We are almost done. Now you have to restart geddy

```
$ geddy
```

Open your browser to [localhost:4000/todos](http://localhost:4000/todos)
and you'll get a list of the todos which should be empty. Go ahead and
look around, you can create show edit and delete todo items. We're going
to make a few changes though.

The first thing we'll do is to add some validation to our Todo model. So
open 'app/models/todo.js' in your editor and add the following lines
anywhere inside the constructor function

```
var Todo = function () {
...
  // Add this inside the constructor function
  this.validatesPresent('title');
  this.validatesLength('title', {min: 5});

  this.validatesWithFunction('status', function (status) {
    return status == 'open' || status == 'done';
  });
...
};
exports.Todo = Todo;
```

Here we are making it so the title property is required and have a
minumum of 5 characters. We also made it so the status acts like a
boolean attribute but uses custom names instead of true/false. We should
also change our `edit` and `add` views to limit the options, but we will
do it as part of the [resources tutorial](#resource), for now we will
leave the views the way they are.

Now that we've made the needed changes, restart Geddy to update our
model changes. Go and play with the app again, create a todo item, try
to edit and test the validation rules. We've got a good todo application
running and didn't really have to do much. Scaffolding is very good when
you need something simple to get you started. To learn more about
controllers and views keep reading and follow the [resources
tutorial](#resource).

### Without scaffolding

Let's start by using the `geddy gen` command to generate a basic
app-structure.

```
$ geddy gen app todo_app
```

Now let's try out our new application by running Geddy from your
application's root

```
$ cd todo_app
$ geddy
```

Your app should be running on port 4000. Visit
[http://localhost:4000](http://localhost:4000) in your browser to see
your app.

#### Optional: check out your app on a mobile phone

-   Open up your favorite phone simulator and go to
    [http://localhost:4000](http://localhost:4000)
-   OR resize your browser to at most 480px wide
-   OR set your app to listen on an external IP address
    and use your actual phone

### Resource

Now, let's get started building our To Do list manager. First, we'll
need to generate the `todo` resource. We do this using the `geddy gen`
command as well:

```
$ geddy gen resource todo title:string status
```

What did that do?

-   It generated a `todo` model including the given model properties
-   It generated a `todos` controller
-   It created a `todos` view directory. Please note the folder is empty
    since resource won't generate any views for you.
-   It generated these routes from a resource route:
    -   `/todos` (GET)
    -   `/todos` (POST)
    -   `/todos/add` (GET)
    -   `/todos/:id/edit` (GET)
    -   `/todos/:id` (GET)
    -   `/todos/:id` (PUT)
    -   `/todos/:id` (DELETE)

### Views

To start creating our views, create a few files in `app/views/todos`,
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
    , action = isUpdate ? todoPath(params.id) + '?_method=PUT' : todosPath
    , deleteAction = isUpdate ? todoPath(params.id) + '?_method=DELETE' : ''
    , btnText = isUpdate ? 'Update' : 'Add'
    , doneSelectAttributes = isUpdate && todo.status === 'done' ? "selected=true" : ''
    , openSelectAttributes = isUpdate && todo.status === 'open' ? "selected=true" : ''
    , titleValue = isUpdate ? todo.title : ''
    , errors = params.errors;
%>
<form id="todo-form" class="form-horizontal" action="<%= action %>" method="POST">
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
todo object to the partial. Modify `app/views/todos/edit.html.ejs` with
the following code:

```
<div class="hero-unit">
  <%= partial('_form', {params: params, todo: todo}); %>
</div>
```

Now that we have views that will create todo items let's add a simple
`show.html.ejs` just so we can test everything end to end. In the
following code I just loop through the params.

```
<div class="hero-unit">
  <%- linkTo('Edit this todo', editTodoPath(params.id), {class: 'btn pull-right'}); %>
  <h3>Params</h3>
  <ul>
  <% for (var p in todo) { %>
    <li><%= p + ': ' + params[p]; %></li>
  <% } %>
  </ul>
</div>
```

Finally we need to create the index action to link everything together.

```
<div class="hero-unit">
  <h2>To Do List</h2>
  <%- linkTo('Create a new To Do', addTodoPath, {class: 'btn pull-right'}) %>
</div>
<% if (todos && todos.length) { %>
  <% for (var i in todos) { %>
  <div class="row todo-item">
    <div class="span8">
        <h3><%- linkTo(todos[i].title, todoPath(todos[i].id)) %></h3>
    </div>
    <div class="span4"><h3><i class="icon-list-alt"></i><%= todos[i].status; %></h3></div>
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

Go ahead and open up `app/models/todo.js`. Read through the commented
out code there for some ideas on what you can do with models. We'll be
writing our model from scratch for this tutorial, so let's leave that
commented out.

So, minus the commented out code, you should have a file that looks like
this:

```
var Todo = function () {

  this.defineProperties({
      title: {type: 'string'}
    , status: {type: 'string'}
  });

};

exports.Todo = Todo;
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
var Todo = function () {

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

exports.Todo = Todo;
```

For the `title` property, we made sure that the property is always
present and we made sure that the `title` property is a minimum of 5
characters long.

For the `status` property, we used a function to validate that the
property is always set to either `open` or `done`.

For more information about Geddy's Models, you can check out the [Model
wiki page](https://github.com/mde/geddy/wiki/Models).

#### Model-adapter

Now that we've set up our `todo` model, we need to define a way to store
it. To keep our models persistance agnostic, Geddy uses model-adapters.
By default it will store objects in memory using the `memory` model
adapter. You can change the default memoryAdapter in
`config/development.js`.

```
defaultAdapter: 'memory'
```

Now we've got a place to store our `todo`'s. This is in your
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

#### Saving todos

To save a todo we need to edit the `create` action in
`app/controllers/todos.js`. It's not doing much at the momment so lets
modify it a little bit.

```
this.create = function (req, resp, params) {
  var self = this
    , todo = geddy.model.Todo.create({title:params.title, status:'open'});

  todo.save(function(err, data) {
    if (err) {
      params.errors = err;
      self.transfer('add');
    } else {
      self.redirect({controller: self.name});
    }
  });
};
```

First, we create a new instance of the `Todo` model with
`geddy.model.Todo.create`, passing in the title that our form will post
up to us, and setting up the default status.

Then we call we call the `save` method. Internally, save does two
things. It validates the model based on the rules we defined earlier.
This is similar to calling `todo.isValid()`. If the model was valid, it
will delegate to the model adapter configured previously to actually
persist the model. If either step fails, you will get an error
collection as the first parameter of the function and we redirect the
user back to the /todos/add route. Otherwise we redirect to the
controller's default action `self.redirect({controller: self.name});`.

#### Listing all todos

Now that we we can create To Do items, we should probably list them
somewhere. Lets change the `index` action in the `todos` controller.

Open up `/app/controllers/todos.js` again and replace the current
implementaton with the following code.

```
this.index = function (req, resp, params) {
  var self = this;

  geddy.model.Todo.all(function(err, todos) {
    self.respond({params: params, todos: todos});
  });
};
```

This part is a bit simpler and it follows a similar pattern. Instead of
calling create in `geddy.model.Todo` this time we simply call `all` and
we pass the data back to the view for rendering

Now that we can can load todo items you can test it by starting up Geddy
and going to [localhost:4000/todos](http://localhost:4000/todos) and you
can view the list of items.

#### Showing a todo

Now that we have our index action working as expected, we should work on
the `show` controller action to display todo details.

```
this.show = function (req, resp, params) {
  var self = this;

  geddy.model.Todo.load(params.id, function(err, todo) {
    self.respond({params: params, todo: todo});
  });
};
```

Now we have a working show action in the controller to load items.

#### Updating a todo

Alright, now that we can view our todos let's edit the `update` and
`edit` actions in the `todos` controller. They should look something
like this:

```
this.edit = function (req, resp, params) {
  var self = this;

  geddy.model.Todo.load(params.id, function(err, todo) {
    self.respond({params: params, todo: todo});
  });
};

this.update = function (req, resp, params) {
  var self = this;

  geddy.model.Todo.load(params.id, function(err, todo) {
    todo.updateAttributes(params);

    todo.save(function(err, data) {
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

#### Deleting a todo

The delete is really simple specially now that you're familiar with the
pattern. This time you will have to call remove passing the id of the
todo you want to delete. We will leave the details as an excercise.
Remember that you can always compare your solution to the [final
version](https://github.com/mde/geddy/tree/master/examples/todo_app).

### API

Check these urls out in your browser:

-   GET: `localhost:4000/todos.json`
-   GET: `localhost:4000/todos/:id.json`
-   POST: `localhost:4000/todos`
-   PUT: `localhost:4000/todos/:id`

### Conclusion

At this point you should have a working To Do List app!

If you want to explore a little more, here are some other things you
could do:

-   Change the `Main#index` route to point to the `Todos#index` action
    (hint, check out `config/router.js`)
-   Add some logging with `geddy.log`
-   Configure mongo, riak or postgress and use it instead of the memory
    modelAdapter. See how easy it's to switch
