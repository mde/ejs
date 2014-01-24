Geddy provides e-mail support, allowing your app to do things like requiring
e-mail activation for new accounts, or sending notifications to your users.
Geddy uses [Nodemailer](http://www.nodemailer.com/) for this feature.

Configure your mail support in your app's configuration (e.g., your
development.js or production.js files). You can set the e-mail username that
will be used in outgoing mails (will be used with the 'hostname' in your
config), and the Nodemailer transport and options. See [Nodemailer
transports](http://www.nodemailer.com/docs/transports) for more details on
transports.

Here's an example of a configuration using Direct transport:

```javascript
, mailer: {
    fromAddressUsername: 'noreply'
  , transport: {
      type: 'direct'
    , options: {
        debug: true
      }
    }
  }
```

And an example using SMTP transport:

```javascript
, mailer: {
    fromAddressUsername: 'noreply'
  , transport: {
      type: 'smtp'
    , options: {
        host: 'smtp.gmail.com'
      , secureConnection: true // use SSL
      , port: 465 // port for secure SMTP
      , auth: {
          user: 'gmail.user@gmail.com'
        , pass: 'userpass'
        }
      }
    }
  }
```

