There is one global object created for Geddy apps, the `geddy` object.  There
are a few namespaces and methods that are available directly on this global.
Methods can be run as soon as the global is defined (e.g., in your app's
config/init.js).

The `geddy` global is also an EventEmitter, with a few lifecycle methods.

#### "initialized" (event)

This event is emitted when your app environment has loaded.

#### "started" (event)

This event is emitted when Geddy's HTTP server has started listening for
requests. This event is useful for knowing when to set up a realtime connection
with Socket.io.

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


