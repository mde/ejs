
geddy.todos = [];

// Add uncaught-exception handler in prod-like environments
if (geddy.config.environment != 'development') {
  process.addListener('uncaughtException', function (err) {
    geddy.log.error(JSON.stringify(err));
  });
}
geddy.model.adapter = {};
geddy.model.adapter.Todo = require(process.cwd() + '/lib/model_adapters/todo').Todo;

