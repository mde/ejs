
var Todos = function () {
  this.respondsWith = ['html', 'json', 'js', 'txt'];

  this.index = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.all(function(err, todos){
      self.respond({params: params, todos: todos});
    });
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var self = this;
    var todo = geddy.model.Todo.create({title: params.title, id: geddy.string.uuid(10), status: 'open'});
    if (todo.isValid()) {
      todo.saved = true;
      todo.save(function(){
        self.redirect({controller: this.name});
      });
    } else {
      this.redirect({controller: this.name, action: 'add?error=true'});
    }
  };

  this.show = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.load(params.id, function(err, todo){
      self.respond({params: params, todo: todo});
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;
    geddy.model.Todo.load(params.id, function(err, todo){
      if (todo && !err) {
        self.respond({params: params, todo: todo});
      } else {
        resp.end();
      }
    });
  };

  this.update = function (req, resp, params) {
    var self = this;
    geddy.model.adapter.Todo.load(params.id, function(err, todo){
      todo.status = params.status;
      todo.save(function(){
        self.redirect({controller: this.name});
      });
    });
  };

};

exports.Todos = Todos;

