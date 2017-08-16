EJS Snippet (plug-in) Reference
==============================

The OptsFilter plug-in lets you set defaults for all ejs options.

It also offers filters to prevent your app or framework from passing
certain options to ejs.

The filters can also be used if your framework uses an older calling
convention and some keys from your locals data are mistaken as options.



Activating the plug-in
---------------------

The plug-in is activated by requiring it.

`require('ejs/plug-ins/ejs-opts-filter');`

This modifies the global instance of ejs. So any code using `require('ejs');`
will have an ejs with the plug-in activated.


Configuration
-------------

`var filter = require('ejs/plug-ins/ejs-opts-filter');`


`filter.keepOnlyOpts = ['cache', 'root'];`

Only the options cache and root are kept.
All other options are blocked.

Use this with caution. You may block important keys, like filename.
You may also block future options, without knowing the consequences.


`filter.removeOpts = ['client'];`

The client option will be blocked.
All other options will be let through.


```
filter.optsDefaults = {
  client: false,
  root: '/tmp'
};
```

Will set the client and root option, if they are not specified.
That is, if there key is not present on the opts object.

The defaults are applied after the filters. 
So a default can be set to an option that was blocked.
