class Todos
  respondsWith: ['html', 'json', 'js', 'txt']

  index: (req, resp, params) ->
    self = this
    geddy.model.Todo.all (err, todos) ->
        self.respond params: params, todos: todos

  add: (req, resp, params) ->
    this.respond params: params

  create: (req, resp, params) ->
    self = this
    todo = geddy.model.Todo.create
      title: params.title
      status: 'open'

    todo.save (err, data) ->
      if err
        params.errors = err
        self.transfer 'add'
      else
        self.redirect controller: self.name

  show: (req, resp, params) ->
    self = this
    geddy.model.Todo.first params.id, (err, todo) ->
      self.respond params: params, todo: todo

  edit: (req, resp, params) ->
    self = this
    geddy.model.Todo.first params.id, (err, todo) ->
      self.respond params: params, todo: todo

  update: (req, resp, params) ->
    self = this
    geddy.model.Todo.first params.id, (err, todo) ->
      todo.updateAttributes params

      todo.save (err, data) ->
        if err
          params.errors = err
          self.transfer 'edit'
        else
          self.redirect controller: self.name

  remove: (req, resp, params) ->
    self = this
    geddy.model.Todo.remove params.id, (err) ->
      if err
          params.errors = err
          self.transfer 'edit'
        else
          self.redirect controller: self.name

exports.Todos = Todos
