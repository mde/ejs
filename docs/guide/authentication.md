Geddy provides built-in authentication which integrates with
[Passport](http://passportjs.org/) to allow auth against either local accounts
or third-party social services like Facebook and Twitter.

#### Using the generator

To set up a new Geddy app with built-in authentication, create your application
like normal, then run the `geddy gen auth` command inside, like so:

```
$ geddy app by_tor
$ cd by_tor
$ geddy gen auth
```

This will pull down [Geddy-Passport](https://github.com/mde/geddy-passport)
using NPM, and install all the needed code into your app. This includes the
needed Passport libraries, and the Geddy models and controllers for the local
User accounts and the login process.

#### Danger, Warning, etc.

The `geddy gen auth` generator should only be used in a new Geddy app. If you
run it inside an existing app, it may overwrite existing files that you wanted
to keep.

If you need to add auth to an existing app, you can take a look at the
Geddy-Passport project, which is itself a Geddy app scaffold, and use the pieces
you need.

#### Configuring Passport

You'll need to add the settings for Passport in your config/secrets.json file.
That includes the redirect locations for after an auth failure/success, and the
OAuth keys for your app. The setting will look similar to this:
```json
{
  "passport": {
    "successRedirect": "/",
    "failureRedirect": "/login",
    "twitter": {
      "consumerKey": "XXXXXX",
      "consumerSecret": "XXXXXX"
    },
    "facebook": {
      "clientID": "XXXXXX",
      "clientSecret": "XXXXXX"
    },
    "yammer": {
      "clientID": "XXXXXX",
      "clientSecret": "XXXXXX"
    }
  }
}
```

#### Local users

Local User accounts just go through the usual RESTful actions you'd get in a
normal Geddy resource. Start at "/users/add" to create a new User. You can
modify "/app/models/user.js" to add any other properties you want.

#### Login with third-party services

A successful login with a third-party service like Facebook or Twitter will
create a linked local User account if one does not exist.

#### E-mail activation

By default, local users require activation via e-mail. This does not apply to
authentication via third-party services.

When a user signs up, an e-mail will be sent to their account with an activation
link. Users will not be able to authenticate until they activate. Geddy auth
sends these e-mails using [Nodemailer](http://www.nodemailer.com/).

For this feature to work, you'll have to `npm install nodemailer` and set it up
in your app config.  You'll also need to set a hostname for your app (for the
activation link) for this to work. You can also easily turn this feature off in
the Users controller.

#### Authenticated users

After a user successfully authenticates, she will end up redirected to the
`successRedirect` you've specified, and there will be two new items in the
user's session:

 * userId -- the id for the local User account
 * authType -- the method of authentication (e.g., 'local', 'twitter')

#### Requiring authentication in your app

Use a before-filter, and redirect to the login page if there is no `userId` in
the user's session. If there is a `userId`, that means the user is
authenticated. There is a built-in `reequireAuth` function in the Passport
helper-library, which does just this.

The User controller for local accounts is protected like this:

```javascript
var passport = require('../helpers/passport')
  , cryptPass = passport.cryptPass
  , requireAuth = passport.requireAuth;

var Users = function () {
  this.before(requireAuth, {
    except: ['add', 'create']
  });

// Rest of controller omitted
```

This allows new accounts to be created, because the 'add' and 'create' actions
are exempted, but only authenticated users can view or update existing users.

