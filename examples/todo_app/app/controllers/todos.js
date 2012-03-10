
var Todos = function () {
  this.respondsWith = ['html', 'json', 'js', 'txt'];

  this.index = function (req, resp, params) {
    this.respond({params: params, todos: geddy.todos});
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var self = this
      , todo = geddy.model.Todo.create({
          title: params.title
        , id: geddy.string.uuid(10)
        , status: 'open'
        });
    todo.save(function (err, data) {
      if (err) {
        params.errors = err;
        self.transfer('add');
      }
      else {
        self.redirect({controller: self.name});
      }
    });
  };

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.load(params.id, function(todo){
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
    geddy.model.adapter.Todo.load(params.id, function (todo) {
      todo.status = params.status ? 'done' : 'open';
      todo.save(function (err, data) {
        if (err) {
          params.errors = err;
          self.transfer('edit');
        }
        else {
          self.redirect({controller: self.name});
        }
      });
    });
  };

};

exports.Todos = Todos;

