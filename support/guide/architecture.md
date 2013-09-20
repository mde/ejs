Geddy is built on the same MVC principles that many popular frameworks are based on. Every Geddy app has its models, controllers, and views as well as config files and routes.

* * *

### structure

```
├── app
│   ├── controllers
│   │   ├── application.js
│   │   └── main.js
│   ├── helpers
│   ├── models
│   └── views
│       ├── layouts
│       │   └── application.html.ejs
│       └── main
│           └── index.html.ejs
├── config
    ├── development.js
    ├── environment.js
    ├── init.js
    ├── production.js
    └── router.js
├── lib
├── log
├── node_modules
└── public
```

* * *

### config
`geddy.config`

Geddy has built in configuration management. Global config options should go in your 'config/environments.js` file. Likewise, your production and development config options should go in their respective files

If you want to start up your app in a specific environment, use the `-e` option:

```
$ geddy -e production
```

* * *

### logger
`geddy.log[level]`

Geddy automatically logs requests to an access log, and you can log anything you'd like to stdout or a file. It supports 9 different log levels from debug to emergency.

#### levels
- `access`: outputs to the access log and stdout
- `debug`: debug level logging
- `info`: info level logging
- `notice`: notice level logging
- `warning`: warning level logging
- `error`: error level logging, prints to stdout and stderr
- `critical`: critical level logging
- `alert`: alert level logging
- `emergency`: emergency level logging

#### examples
```
geddy.log.debug('someting to debug')
// prints `something to debug` to the console


geddy.log.error('something went wrong')
// prints 'something went wrong' to stderr and the console
```

* * *
