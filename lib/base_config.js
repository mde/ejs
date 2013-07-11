 var path = require('path')
  , config
  , cwd = process.cwd();

config = {
// Default to prod
  environment: 'development'
// Number of worker-processes to spawn
, workers: 2
// Port to listen on
, port: 4000
// Default to no SSL and SPDY setup
, spdy: null
, ssl: null
// Maps flash message keys to css classes
, flash: {
    defaultClass: 'alert'
  , inlineClasses: {
      success: 'alert alert-success',
      alert: 'alert',
      error: 'alert alert-error',
      info: 'alert alert-info'
    }
  , blockClasses: {
      success: 'alert alert-block alert-success',
      alert: 'alert alert-block',
      error: 'alert alert-block alert-error',
      info: 'alert alert-block alert-info'
    }
  }
// Set stdout to debug log-level
, debug: false
// Use worker-process rotation
, rotateWorkers: true
// How long for a full rotation
, rotationWindow: 2 * 60 * 60 * 1000
// How long to wait for in-flight requests before rotating
, rotationTimeout: 5 * 60 * 1000
// Default logfile location
, logDir: path.normalize(cwd + '/log')
// How long to wait for in-flight requests before killing
, gracefulShutdownTimeout: 30000
// Number of milliseconds between heartbeat calls from
// the worker to the master
, heartbeatInterval: 5000
// Number of milliseconds old a heartbeat-timestamp can be
// before assuming a worker is hung, and needs to be killed
, heartbeatWindow: 20000
// Place to look for static content to serve in dev-mode
, staticFilePath: path.normalize(cwd + '/public')
// static file cache control
, cacheControl: {
  // should contain mime-types as keys and expiration time in seconds as values, if mime type was not found the default will be used
  expires: {
    default: 0
  }
}
// Default session-settings -- setting to null will mean no sessions
, sessions: {
    store: 'cookie',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60
  }
// Key for when using Cookie session-store
, cookieSessionKey: 'sdata'
// Where to look for locale text-files by default
, i18n: {
    defaultLocale: 'en-us'
  , loadPaths: [path.normalize(cwd + '/config/locales')]
  }
// Default to null, accept connections directed to any IPv4 address
, hostname: null
// Used in helpers
, fullHostname: null
// Switch for making before/after filters compatible with
// Connect middleware
, connectCompatibility: false
};

module.exports = config;
