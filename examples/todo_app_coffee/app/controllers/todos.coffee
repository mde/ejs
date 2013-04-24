class Todos
  respondsWith: ['html', 'json', 'js', 'txt']

  index: (req, resp, params) ->
    geddy.model.Todo.all (err, todos) =>
        @respond params: params, todos: todos

  add: (req, resp, params) ->
    @respond params: params

  create: (req, resp, params) ->
    todo = geddy.model.Todo.create
      title: params.title
      status: 'open'

    todo.save (err, data) =>
      if err
        params.errors = err
        @transfer 'add'
      else
        @redirect controller: @name

  show: (req, resp, params) ->
    geddy.model.Todo.first params.id, (err, todo) =>
      @respond params: params, todo: todo

  edit: (req, resp, params) ->
    geddy.model.Todo.first params.id, (err, todo) =>
      @respond params: params, todo: todo

  update: (req, resp, params) ->
    geddy.model.Todo.first params.id, (err, todo) =>
      todo.updateAttributes params

      todo.save (err, data) =>
        if err
          params.errors = err
          @transfer 'edit'
        else
          @redirect controller: @name

  remove: (req, resp, params) ->
    geddy.model.Todo.remove params.id, (err) =>
      if err
          params.errors = err
          @transfer 'edit'
        else
          @redirect controller: @name

exports.Todos = Todos
