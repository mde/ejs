var Todo = new (function () {

  this.all = function (callback) {
    callback(null, geddy.todos);
  }

  this.load = function (id, callback) {

    for (var i in geddy.todos) {
      if (geddy.todos[i].id == id) {
        return callback(null, geddy.todos[i]);
      }
    }
    callback({message: "To Do not found"}, null);

  };

  this.save = function (todo, opts, callback) {

    if (typeof callback != 'function') {
      callback = function(){};
    }

    var todoErrors = null;
    for (var i in geddy.todos) {

      // if it's already there, save it
      if (geddy.todos[i].id == todo.id) {
        geddy.todos[i] = todo;
        todoErrors = geddy.model.Todo.create(todo).errors;
        return callback(todoErrors, todo);
      }

    }
    todo.saved = true;
    geddy.todos.push(todo);
    return callback(null, todo);

  }

  this.remove = function(id, callback) {

    if (typeof callback != 'function') {
      callback = function(){};
    }

    for (var i in geddy.todos) {
      if (geddy.todos[i].id == id) {
        geddy.todos.splice(i, 1);
        return callback(null);
      }
    }

    return callback({message: "To Do not found"});

  }

})();

exports.Todo = Todo;
