var Todo = new (function () {

  this.load = function (id, callback) {
    for (var i in geddy.todos) {
      if (geddy.todos[i].id == id) {
        callback(geddy.todos[i]);
        return;
      }
    }
    callback({});
  };

  this.save = function (todo, opts, callback) {
    for (var i in geddy.todos) {

      // if it's already there, save it
      if (geddy.todos[i].id == todo.id) {
        geddy.todos[i] = todo;
        return callback(null, todo);
      }

    }
    todo.saved = true;
    geddy.todos.push(todo);
    return callback(null, todo);
  }

})();

exports.Todo = Todo;
