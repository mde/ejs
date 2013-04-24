Geddy has a robust CLI tool to help you generate apps, run your tests, or play with your app in a console.

####Options:

- `—environment, -e`: Environment to use
- `—port, -p`: Port to connect server to
- `—workers, -w`: Number of workers to use (default: 1)
- `—debug, -d`: Sets the log level to output debug messages to console
- `—jade, -j`: When generating views, use Jade templates(Default: EJS)
- `—handle, -H`: When generating views, use Handlebars templates(Default: EJS)
- `—mustache, -m`: When generating views, use Mustache templates(Default: EJS)
- `—version, -v`: Output the version of Geddy installed
- `—help, -h`: Output the list of commands and options

#### geddy
`geddy` takes no arguments, it will run the geddy app in the current directory.

```
$ cd path/to/app
$ geddy
// will run the app in path/to/app
```

#### app
`app` takes a single argument being the name you'd like, then it will generate a base application. If no name is given the command will fail. If you include the `—jade`, `—handle`, or `—mustache` option you can substitute the templating language to your liking

```
$ geddy app app_name
// creates a geddy app using EJS
```

#### resource
`resource` takes one or more arguments, the first being a name and the others being a set of model properties. This will create a controller, a model including the given model properties and a resource route.

```
$ geddy resource user name description password
// This will create a user model, users controller, and user routes
```

#### scaffold
`scaffold` takes one or more arguments, the first being a name and the others being a set of model properties. Scaffolding includes a controller, a model including the given model properties as well as a default model adapter a resource route and will create all views. If you also include the options `—jade`, `—handle` or `—mustache` you can substitute the template language to your liking.

```
$geddy scaffold user name description password
// This will create a user model, users controller, user views, and user routes
```

#### controller
`controller` takes a single argument being a name. It will create a new controller, a route and an index view. If you also include the options `—jade`, `—handle` or `—mustache` you can substitute the template language to your liking.

```
$ geddy controller users
```

#### model
`model` takes one or more arguments, the first being a name and the others being a set of model properties. This will create a new model including the model properties given.

```
$ geddy model user name description password
// creates a user model with name, description and password properties
```

#### secret
`secret` doesn't take any arguments, it will find your config/environment file and create a new secret in it deleting any other secret.

```
$ geddy secret
```

#### console
`console` doesn't take any arguments, it will start a geddy console.

```
$ geddy console
```

#### jake
`jake` takes a task name, it will run a jake command in your apps context from your app's Jakefile

```
$ geddy jake test
// will run the test task in your app's Jakefile after loading up your app environment
```
