 var config = {
// Default to prod
  environment: 'production'
// Number of worker-processes to spawn
, workers: 2
// Port to listen on
, port: 4000
// Set stdout to debug log-level
, debug: false
// Use worker-process rotation
, rotateWorkers: true
// How long for a full rotation
, rotationWindow: 2 * 60 * 60 * 1000
// Default logfile location
, logDir: process.cwd() + '/log'
// How long to wait for in-flight requests before killing
, gracefulShutdownTimeout: 30000
// Number of milliseconds old a heartbeat-timestamp can be
// before killing the worker process
, heartbeatWindow: 20000
// Place to look for static content to serve in dev-mode
, staticFilePath: process.cwd() + '/public'
// Default session-settings -- setting to null will mean no sessions
, sessions: {
    store: 'memory',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60
  }
// Key for when using Cookie session-store
, cookieSessionKey: 'sdata'
 };

module.exports = config;
