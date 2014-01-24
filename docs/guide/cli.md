Geddy has a robust CLI tool to help you generate apps, run tests or scripting tasks in your app, or interact with your app in a console.

#### geddy

Running the `geddy` command with no arguments will run the geddy app in the current directory.

```
cd path/to/app
geddy
// will run the app in path/to/app
```

*Options*:

- `--environment, -e`: Environment to use
- `--hostname, -b`: Host name or IP to bind the server to (default: localhost)
- `--port, -p`: Port to bind the server to (default: 4000)
- `--geddy-root, -g`: /path/to/approot The path to the root for the app you want to run (default is current working directory)
- `--workers, -w`: Number of worker processes to start (default: 1)
- `--debug, -d`: Sets the log level to output debug messages to the console
- `--help, -h`: Output this usage dialog
- `--version, -v`: Output the version of Geddy that's installed

*Examples*

```
# Start Geddy on localhost:4000 in development mode or if the
# directory isn't a Geddy app it'll display a prompt to use "geddy -h"
geddy
# Start Geddy on port 3000
geddy -p 3000
# Start Geddy in production mode
geddy -e production
# Generate a users scaffolding using Jade templates
geddy -j scaffold user

```

#### geddy console

This command starts a REPL in the context of your application. It will load your
application's environment, and you can interact with all its models.

*Examples*

```
# Start a REPL (in 'production' mode)
geddy console
# Start a REPL in 'development' mode
geddy console environment=development
```

#### geddy gen [command] [options] [arguments]

This is the generator script which you can use to create apps, resource
scaffolds, or bare models and controllers.

*Commands*

- `gen app <name>`: Create a new Geddy application
- `gen resource <name> [attrs]`: Create a new resource. A resource includes a model, controller and route
- `gen scaffold <name> [attrs]`: Create a new scaffolding. Scaffolding includes the views, a model, controller and route
- `gen secret`: Generate a new application secret in `config/secret.json`
- `gen controller <name>`: Generate a new controller including an index view and and a route
- `gen model <name> [attrs]`: Generate a new model
- `gen auth[:update]`: Creates user authentication for you, using Passport.
- `gen migration <name>`: Generate an empty migration for SQL databases

For all of these commands, `[attrs]` is a list of attributes for the model, in
the format of 'name:datatype' (e.g., foo:int).

*Options*

- `--realtime, -rt`: When generating or scaffolding, take realtime into account
- `--jade, -j`: When generating views this will create Jade templates (Default: EJS)
- `--handle, -H`: When generating views this will create Handlebars templates (Default: EJS)
- `--mustache, -m`: When generating views this will create Mustache templates (Default: EJS)
- `--swig, -s`: When generating views this will create Swig templates (Default: EJS)

*Examples*

```
# Generate an app in a directory named 'foo'
geddy gen app foo
# Generate a users resource with the model properties name as a string and admin as a boolean
geddy gen resource user name admin:boolean
# Generate a users scaffolding user name as the default value to display data with
geddy gen scaffold user name:string:default

```

#### geddy jake [task] [options] [env vars]

This command runs a Jake task in the context of the current app. This allows you
to run your tests or any other command-line tasks in the context of your
application, with full access to your models.

Geddy also ships with a number of useful Jake tasks built in, e.g., the `routes`
task, which displays all the routes in your app.

*Options*

See https://github.com/mde/jake for full documentation

*Examples*

```
# Run your app's tests in the app environment
geddy jake test
# Initialize the development database for your app
geddy jake db:init environment=development
# Show all routes
geddy jake routes
# Show all routes for the user resource
geddy jake routes[user]
# Show the index route for the user resource
geddy jake routes[user.index]
```

**To run "geddy jake" in a different environment** do

```
geddy jake environment=[myEnvironment]
```

