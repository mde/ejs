Geddy has APIs of different levels of granularity for responding to requests.
From highest-level to lowest:

 * respondWith
 * respondTo
 * respond/redirect
 * output

In general, you'll be able to use the highest-level API and expect Geddy to do
the right thing, but the lower-level APIs are there if you need to do more
specific things with your responses.

### respondWith

[`respondWith` method in API reference](/reference#controllers.respondWith)

The `respondWith` method is the highest-level response API. It handles
formatting your output in the correct way, but also allows more general
format-specific behaviors like doing redirects, or adding needed headers.

The best example of this is handling a response for a REST `create` request. In
the case of a request that wants back an HTML response, after creating the item
you'll want to respond with a redirect for the item's HTML page. In the case of
a request that wants back JSON, you'll want to respond with a 201/created, and
include a 'Location' header with the URL for the newly-created item.

To use `respondWith`, specify the formats your controller can use by calling
`canRespondTo` with the list of formats:

```javascript
var SnowDogs = function () {
  this.canRespondTo(['html', 'json', 'js']);
};
```

That will allow your controller to respond with the built-in response-strategies
for these formats.

Call `respondWith` with a Geddy model instance, or a collection of instances, like so:

```javascript
var SnowDogs = function () {
  this.canRespondTo(['html', 'json', 'js']);

  this.index = function (req, resp, params) {
    var self = this;
    geddy.model.SnowDog.all(function(err, snowDogs) {
      if (err) {
        throw err;
      }
      self.respondWith(snowDogs);
    });
  };

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.SnowDog.first(params.id, function(err, snowDog) {
      if (err) {
        throw err;
      }
      if (!snowDog) {
        throw new geddy.errors.NotFoundError('SnowDog ' + params.id + ' not found.');
      }
      self.respondWith(snowDog);
    });
  };
};
```

When you `throw` an error, Geddy will still perform content-negotiation and
respond with an error of the correct format. If the requests wants a JSON
response, Geddy will respond with a nice, parseable JSON response that includes
a statusCode, statusText, message, and stack, if one is available.

### respondTo

[`respondTo` method in API reference](/reference#controllers.respondTo)

The `respondTo` method is the next level down in API granularity. It allows you
to specify your own response-strategies to use for the response. NOTE: calling
`respondTo` will override any formats declared using `canRespondTo`.

Call `respondTo` with an object containing the various response-strategies you want to use for the response, like so:

```javascript
var Users = function () {

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.User.first({username: 'foo'}, function (err, user) {
      if (err) {
        throw err;
      }
      self.respondTo({
        html: function () {
          self.redirect('/user/profiles?user_id=' + user.id);
        }
      , json: function () {
          self.respond(user, {format: 'json'});
        }
      });
    });
  };
};
```

Using `respondTo` also allows you to do more than simply output formatted
content. You can perform redirects, set headers, etc.

If you want to create your own specific response-strategies, you can also create
a custom responder.

### respond and redirect

[`respond` method in API reference](/reference#controllers.respond)

[`redirect` method in API reference](/reference#controllers.redirect)

The `respond` method is a lower-level API call that simply outputs content in
the correct format for a request. The 'html' format will render the appropriate
template for the request, and API-style formats like 'json' will simply output
the data-payload you pass in with the desired format:

```javascript
var Users = function () {

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.User.first({username: 'foo'}, function (err, user) {
      if (err) {
        throw err;
      }
      this.respond(user);
    });
  };
};
```

The `respond` method takes an 'options' object that allows you set specific
properties like the layout, or format to respond with. If you don't pass a
format-override, Geddy will figure out the right format based on the
file-extension requested, and the formats your controller supports.

The `redirect` method is exactly what it sounds like -- a way to tell the
browser to request a different URL from your application. You can pass it a
location string, or an object referencing specific controller or action.

### output

[`output` method in API reference](/reference#controllers.output)

The `output` method is the lowest-level API for responding to a request. You
should only use this method when you know precisely what you want in the
response (i.e., HTTP status-code, headers, and content). Here's an example:

```javascript
var Users = function () {

  this.create = function (req, resp, params) {
    var self = this
      , user = geddy.model.User.create(params);
    if (!user.isValid()) {
      throw new geddy.errors.BadRequestError('Oops!');
    }
    user.save((function (err, data) {
      if (err) {
        throw err;
      }
      // Respond with a 201/created and no content
      this.output(201, {
        'Content-Type': 'application/json'
      , 'Location': '/users/' + user.id
      });
    });
  };
};
```

### Custom responders

You can write your own Responder (with its own response-strategies) to use in
your controller with `respondWith`.

The simplest possible example of a custom responder is just a function. Set it
to your own custom responder in your controller like so:

```javascript
this.responder = function (controller, content, opts) {
  // Redirect Web content
  if (opts.format == 'html') {
    controller.redirect('/web' + controller.request.url);
  }
  else {
    controller.respond(content, opts);
  }
};
```

Or you can subclass the built-in Geddy responder, and change its strategies, or
its `respond` method. Its strategies live on its 'strategies' property:

```javascript
var CustomResponder = function () {
  var builtIns = geddy.responder.strategies;
  this.strategies = {
    html: builtIns.html
  , json: builtIns.json
  , xml: function (content, opts) {
      // Do something special for XML responses
    }
  };
};
CustomResponder.prototype = Object.create(geddy.responder.Responder.prototype);
```

Strategies are invoked on your controller instance, so 'this' will be a
reference to your controller.

Also, you can also override the responder's `respond` method:

```javascript
CustomResponder.respond = function (controller, content, opts) {
  var strategies = this.strategies;
  if (opts.format == 'xml') {
    throw new Error('Nobody uses XML anymore, buddy.');
  }
  // Otherwise, we don't care what format, just output
  controller.respond(content, opts);
};

```

To use your subclassed responder, set it in your controller:

```javascript
this.responder = new CustomResponder();
```
