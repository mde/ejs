Geddy supports HTTPS via SSL/TLS or SPDY. To enable it, add the following to your configuration file.
The configuration requires at least the `key` and `cert` options, but all of the options that are
available for the `https` and `spdy` modules are supported.

To add SSL/TLS simply add the following lines to your config file:
```
// ...
, ssl: {
    key: 'config/key.pem',
    cert: 'config/cert.pem'
  }
// ...
```

To add support for SPDY add the follwing:
```
// ...
, spdy: {
    key: 'config/key.pem',
    cert: 'config/cert.pem'
  }
// ...
```

If you notice the following configuration options use a file name rather than the files contents,
like the standard options for `https` and `spdy`, this is because Geddy handles that for you. If
you also have to include a list of certificate authorities, use the `ca` option, but instead of
giving it an array of the file names for each authority, you can also include a single file name
pointing to a bundled certificate.

Here is a decent step-by-step guide to creating a self-signed SSL certificate:
[http://www.akadia.com/services/ssh_test_certificate.html](http://www.akadia.com/services/ssh_test_certificate.html)
