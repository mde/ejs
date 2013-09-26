Geddy's view layer provides a versatile set of templating languages and helpers to get you started quickly.

The view layer supports these four templating engines:

+ EJS (.ejs)
+ Jade (.jade)
+ Mustache (.mu, .ms, .mustache)
+ Handlebars (.hbs, .handlebars)
+ [Swig](http://paularmstrong.github.io/swig/) (.swig)

To use a certain template engine just give the view a corresponding extension listed above.

When using the Geddy CLI to generate parts of your application you can use different template languages by giving an argument to the command, here are some examples:

```
geddy app --mustache my_app
geddy scaffold -m user


geddy app --jade my_app
geddy scaffold -j user


geddy app --handle my_app
geddy scaffold -H user

geddy app --swig my_app
geddy scaffold --swig user
```

* * *

