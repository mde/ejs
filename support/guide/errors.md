Geddy makes it easy to return errors, and gives you an easy way to customize the
error-responses you return.

### Returning an error

To return an error as your response, simply `throw` the error you want. Geddy
includes the full range of HTTP errors (as subclasses of the base JavaScript
Error object) on the `geddy.errors` namespace object:

* BadRequestError
* UnauthorizedError
* ForbiddenError
* NotFoundError
* MethodNotAllowedError
* NotAcceptableError
* InternalServerError

If you throw a generic JavaScript Error object, Geddy will actually respond with
a 500/InternalServerError.

Here's an example:

```javascript
  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.SnowDog.first(params.id, function(err, snowDog) {
      if (err) {
        throw err;
      }
      if (!snowDog) {
        throw new geddy.errors.NotFoundError();
      }
      else {
        self.respondWith(snowDog);
      }
    });
  };
```

### Error formats

If you make an API-style request for JSON data, and an error occurs, it's stupid
for the server to respond with a rendered HTML page. Why would you expect a
different content-type from the one requested just because an error occurred?

When there's an error, Geddy still does the right thing with the format, and
returns the error in the expected content-type.

For example, a 404/NotFoundError for a JSON response would look like this:

```javascript
{ statusCode: '404',
  statusText: 'Not Found',
    message: 'Could not find page "/foo/bar/baz.json"',
      stack: 'Not Found\n    at ...'
}
```

The stack-trace, if one is available, will be included in the 'stack' property
of the response.

### Customizing errors

For HTML responses, Geddy makes it easy to customize error pages. Views for
errors can be found in your app in 'app/views/errors'. To add a customized view
for a particular type of error, add a view with the name of the error in
'snake_case' in that directory.

For example, for a customized 404 NotFoundError page, you can add a
'not_found.html.ejs' in the directory. Any error-types (e.g., BadRequestError)
without a specific view in that directory will use the 'default' view.

All error pages use the 'errors' layout in 'app/views/layouts'.

### Errors with your errors

When there's an error rendering your custom error page ('Error Inception'),
Geddy fallback to a simple, low-fi error-page to display the rendering error.
Fix the rendering error, and your nice, customized error will appear.
