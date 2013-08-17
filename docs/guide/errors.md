Geddy makes it easy to return errors, and gives you an easy way to customize the
error-responses you return.

#### Returning an error

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

Here's an example:

```javascript
  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.SnowDog.first(params.id, function(err, snowDog) {
      if (!snowDog) {
        throw new geddy.errors.NotFoundError();
      }
      else {
        self.respondWith(snowDog);
      }
    });
  };

```



