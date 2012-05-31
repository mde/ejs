Todo = ->
  @defineProperties
    title:
      type: 'string'
      required: true
    id:
      type: 'string'
      required: true
    status:
      type: 'string'
      required: true

  @validatesPresent 'title'
  @validatesLength 'title', min: 5

  @validatesWithFunction 'status', (status) ->
    status == 'open' || status == 'done'

  @adapter = 'Mongo'

Todo = geddy.model.register 'Todo', Todo
