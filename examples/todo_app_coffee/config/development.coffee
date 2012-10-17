config =
  detailedErrors: false
  hostname: null
  port: 4000
  model:
    defaultAdapter: 'memory'
  sessions:
    store: 'memory'
    key: 'sid'
    expiry: 14 * 24 * 60 * 60

module.exports = config