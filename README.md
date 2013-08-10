# Geddy
#### A simple, structured web framework for Node

[![Build Status](https://travis-ci.org/mde/geddy.png?branch=master)](https://travis-ci.org/mde/geddy)

#### Install Geddy:

```
$ npm install -g geddy
```

#### Create an app, start it up:

```
$ geddy gen app my_app
$ cd my_app
$ geddy
Creating 1 worker process.
Server worker running in development on port 4000
```

#### Create a CRUD resource

```
$ geddy gen scaffold foobar baz:string qux:int
[Added] app/models/foobar.js
[Added] db/migrations/20130809201124_create_foobars.js
[Added] test/models/foobar.js
[Added] test/controllers/foobars.js
[Added] app/controllers/foobars.js
[Added] Resource foobars route added to config/router.js
[Added] View templates
```

#### Documentation

Docs are on the GeddyJS Website: http://geddyjs.org/documentation

#### Community

* Mailing list: [https://groups.google.com/group/geddyjs](https://groups.google.com/group/geddyjs)
* IRC: #geddy on Freenode

#### License

Apache License, Version 2

- - -
Geddy Web-app development framework copyright 2112
mde@fleegix.org.

