var Todo = new (function () {

  this.all = function (callback) {
    var todos = [];
    geddy.db.todos.find().toArray(function(err, docs){

      // if there's an error, return early
      if (err) {
        return callback(err, null);
      }

      // iterate through the docs and create models out of them
      for (var i in docs) {
        todos.push( geddy.model.Todo.create(docs[i]) )
      }

      return callback(null, todos);

    });
  }

  this.load = function (id, callback) {
    var todo;

    // find a todo in the db
    geddy.db.todos.findOne({id: id}, function(err, doc){

      // if there's an error, return early
      if (err) {
        return callback(err, null);
      }

      // if there's a doc, create a model out of it
      if (doc) {
        todo = geddy.model.Todo.create(doc);
      }

      return callback(null, todo);

    });

  };

  this.save = function (todo, callback) {
    // sometimes we won't need to pass a callback
    if (typeof callback != 'function') {
      callback = function(){};
    }

    // Mongo doesn't like it when you send functions to it
    // so lets make sure we're only using the properties
    todo = {
      id: todo.id
    , saved: todo.saved
    , title: todo.title
    , status: todo.status
    };

    // Check to see if we have this to do item already
    geddy.db.todos.findOne({id: todo.id}, function(err, doc){

      // if theres an error, log it and
      if (err) {
        geddy.log.error(err);
        return callback(err, null);
      }

      // if we already have the to do item, update it with the new values
      if (doc) {
        geddy.db.todos.update({id: todo.id}, todo, function(err, docs){
          return callback(err, docs);
        });
      }

      // if we don't already have the to do item, save a new one
      else {
        geddy.db.todos.save(todo, function(err, docs){
          return callback(err, docs);
        });
      }

    });

  }

})();

exports.Todo = Todo;
