There is one global object created for Geddy apps, the `geddy` object.  There
are a few namespaces and methods that are available directly on this global.
Methods can be run as soon as the global is defined (e.g., in your app's
config/init.js).

The `geddy` global is also an EventEmitter, with a few lifecycle methods.

#### "initialized" (event, worker only)

This event is emitted by a worker process when your application has loaded.

#### "started" (event, worker only)

This event is emitted by a worker process when Geddy's HTTP server has started
listening for requests. This event is useful in your application for knowing
when to set up a realtime connection with Socket.io.

#### "clusterStarted" (event, cluster master only)

This event is emitted by a cluster's master process when the HTTP servers for
all workers have started listening for requests.

#### .start
`start(config)`

This command starts an unclustered Geddy application with no worker processes,
directly in the current process. This assumes you have installed Geddy locally
instead of globally, and have required the `geddy` object in the current script.

##### config
- `config [object]`: The configuration object passed to the Geddy application
for startup. These configuration options correspond to the options passed to the
CLI startup script.

##### example
```
var geddy = require('geddy');
// Start up an unclustered app in the current process
geddy.start({
  port: 4001
});
```

#### .startCluster
`startCluster(config)`

Starts a clustered Geddy application with the load shared across multiple worker
processes. This assumes you have installed Geddy locally instead of globally,
and have required the `geddy` object in the current script.

##### config
- `config [object]`: The configuration object passed to the Geddy application
for startup. These configuration options correspond to the options passed to the
CLI startup script.

##### example
```
var geddy = require('geddy');
// Start up a clustered app
geddy.startCluster({
  environment: 'production'
, port: 4002
, workers: 3
});
```
#### .stop
`stop`

Used to stop an unclustered Geddy application with no worker processes. This
command should not be used with a clustered app.

##### example
```
var geddy = require('geddy');
// Start up a server and immediately shut it back down
geddy.start();
geddy.on('started', function () {
  console.log('server started, now shutting down');
  geddy.stop();
});
```

#### .stopCluster
`stopCluster`

Used to stop an clustered Geddy application. This command should only be used in
the master process of a clustered server.

##### example
```
var geddy = require('geddy');
// Start up a clustered server and immediately shut it back down
geddy.startCluster({
  workers: 3
});
geddy.on('clusterStarted', function () {
  console.log('cluster started, now shutting down');
  geddy.stopCluster();
});

```

#### .addFormat
`addFormat(name, contentType, formatter)`

Adds a format (i.e., content-type or MIME type) that your app can handle.

##### name
- `name [string]`: the name of the format (e.g., Geddy's built-ins include
'json', 'txt', 'html')

##### contentType
- `contentType [string|array]`: Content-type (or array of types) browsers will give the
server for this format. If this is passed as an array, the first item will be
used as the Content-Type header in the outgoing response.

##### formatter
- `formatter [function]`: Function which puts the content into the desired
format. Takes one parameter, an object input, and returns the formatted content.
For example, the formatter function for the built-in 'json' format runs
`JSON.stringify` on the content and returns the result.

##### example
```
this.addFormat('zerp', ['application/zerp', 'text/zerp'], function (content) {
  var res;
  if (content) {
    // Zerpify the content if possible
    if (typeof content.zerpify == 'function') {
      res = content.zerpify();
    }
    // Fall back to string
    else {
      res = content.toString();
    }
  }
  else {
    res = '';
  }
  return res;
});
```


