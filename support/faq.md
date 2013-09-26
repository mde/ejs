### Which templating engines does Geddy support?
+ EJS
+ Jade
+ Handlebars
+ Mustache
+ Swig

### Which databases does Geddy's model layer have adapters for?
+ MongoDB
+ Postgres
+ Riak
+ in-memory

### Which database adapter does Geddy's model layer default to?
Geddy defaults to using the in-memory adapter for newly generated apps, but it's easy to change if you'd like.

### Do I have to use the same database adapter for all of my models?
Nope! Geddy was built with data versatility in mind. Each of your models can define it's own adapter, or it can fall back to your globally set adapter.

### How does Geddy scale across multiple processes?
Geddy uses Node's built in cluster module to create worker processes. This is configurable on an environment to environment basis.

### Does Geddy support resourceful routes?
Yep! Just use the router's built in '[resource](/reference#router.resource)' method and it will build out a full restful API for your resource.

### Can Geddy generate an app structure for me?
Yes it can, just use the '[geddy gen app](/guide#CLI)' command.

### Can it scaffold resources for me too?
Yep - the '[geddy gen scaffold](/guide#CLI)' command is the one you're looking for.

### Your copyright year is in the future.
That's not a question.

### Where does Geddy's name come from?
[Geddy Lee](http://en.wikipedia.org/wiki/Geddy_Lee) is the bass player and singer for the band [Rush](http://en.wikipedia.org/wiki/Rush_%28band%29).
