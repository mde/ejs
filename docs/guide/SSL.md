Geddy supports HTTPS via SSL key/cert. Simply include your key and cert in the
Geddy configuration, like so:

```javascript
, ssl: {
    key: 'config/key.pem'
  , cert: 'config/cert.pem'
  }
```

Here is a decent step-by-step guide to creating a self-signed SSL certificate:
[http://www.akadia.com/services/ssh_test_certificate.html](http://www.akadia.com/services/ssh_test_certificate.html)
