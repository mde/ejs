# Add uncaught-exception handler in prod-like environments
if geddy.config.environment != 'development'
  process.addListener 'uncaughtException', (err) ->
    geddy.log.error JSON.stringify(err)
