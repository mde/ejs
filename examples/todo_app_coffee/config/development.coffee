config =
  detailedErrors: false
  hostname: null
  port: 4000
  sessions:
    store: 'memory'
    key: 'sid'
    expiry: 14 * 24 * 60 * 60
  db:
    mongo:
      db: 'todo'

module.exports = config


