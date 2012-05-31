Todo = ->
  this.defineProperties
    title:
      type: 'string'
      required: true
    id:
      type: 'string'
      required: true
    status:
      type: 'string'
      required: true

  this.validatesPresent 'title'
  this.validatesLength 'title',
    min: 5

  this.validatesWithFunction 'status', (status) ->
    status == 'open' || status == 'done'

Todo = geddy.model.register 'Todo', Todo

