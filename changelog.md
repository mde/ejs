### 0.8
+ Flash-messages for session
+ Through-associations for models
+ Eager-loading model associations for SQL adapters
+ Improvements to selectTag helper
+ Fixes for MongoDB session-store
+ --geddy-root CLI option for setting application root
+ Handle special characters in HTTP referer header
+ Improvements to generated CRUD scaffolds
+ Improved tests for controllers
+ Enable custom HTTP status-code for response
+ Enable empty response-bodies
+ Fixes to Redis session-store
+ Fixes for JSON content-type
+ Massive refactor of app-loading code

### 0.7
+ Node v0.10 compatibility
+ Better CLI help
+ RT code for non-EJS templating
+ Correct handling for CSV content-type
+ Updates to bundled JQuery and Bootstrap for templates
+ package.json for generated apps
+ Optional HTTP status-code for redirects
+ Ton of grammar and spelling fixes for the README, docs and Web site
+ Flexible generator for action-helpers
+ `routes` command for CLI
+ --bind CLI option for server IP address
+ CoffeeScript support for routes
+ Non-EJS support for `auth` generator
+ Better docs for Heroku and NodeJitsu deploy

### 0.6
+ Models can now be used on the front end
+ Added the `-rt` option for app generation
+ Added realtime system to models
+ Added a connect compatibility mode to before and after filters
+ Added authentication system
+ Added named associations
+ Made deploying to PaaS's a little easier
+ New Chinese, Russian locales
+ Removed Templato dependency
+ Fixed a ton more bugs (keep 'em coming!)

### 0.5
+ Brand new Web site with extensive docs
+ Removed models from geddy core, moved into Model project
+ Removed utilities from geddy core, moved into Utilities project
+ Removed router from geddy core, replaced with Barista
+ Added view helpers
+ Added [model](https://github.com/mde/model) as a dependency
+ Added [utilities](https://github.com/mde/utilities) as a dependency
+ Added [barista](https://github.com/kieran/barista) as a dependency
+ Added the `geddy console` command for CLI access to apps
+ Added the `geddy jake` command to run Jake tasks in the app environment
+ Added a ton of tests
+ Fixed a ton of bugs
