class Main
  index: (req, resp, params) ->
    this.respond params,
      format: 'html'
      template: 'app/views/main/index'

exports.Main = Main


