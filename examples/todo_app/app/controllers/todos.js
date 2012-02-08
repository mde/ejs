
var Todos = function () {
  this.respondsWith = ['html', 'json', 'js', 'txt'];

  this.index = function (req, resp, params) {
    this.respond({params: params, todos: geddy.todos});
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var todo = geddy.model.Todo.create({title: params.title, id: geddy.string.uuid(10), status: 'open'});
    if (todo.isValid()) {
      todo.save();
      this.redirect({controller: this.name});
    } else {
      this.redirect({controller: this.name, action: 'add?error=true'});
    }
  };

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.load(params.id, function(todo){
      console.log(todo);
      self.respond({params: params, todo: todo});
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;
    geddy.model.Todo.load(params.id, function(todo){
      self.respond({params: params, todo: todo});
    });
  };

  this.update = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.load(params.id, function(todo){
      todo.status = params.status;
      todo.save();
      self.redirect({controller: this.name, id: params.id});
    });
  };

  this.remove = function (req, resp, params) {
    geddy.model.adapter.Todo.removeById(params.id);
    this.respond({params: params});
  };

};

exports.Todos = Todos;

