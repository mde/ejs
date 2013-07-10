/*!
 * Log.js
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter;
var color = require('./color');
/**
 * Initialize a `Loggeer` with the given log `level` defaulting
 * to __DEBUG__ and `stream` defaulting to _stdout_.
 *
 * @param {Number} level
 * @param {Object} stream
 * @api public
 */
var Log = exports = module.exports = function Log(level, stream, printSync) {
    if ('string' == typeof level) level = exports[level.toUpperCase()];
    this.level = level || exports.DEBUG;
    this.stream = stream || process.stdout;
    this.writing = true;
    if (stream === null) {
      this.stream = stream;
      this.writing = false;
    }
    this.printSync = printSync || false;
    if (this.writing && this.stream.readable) this.read(level);
};
/**
 * System is unusable.
 *
 * @type Number
 */
exports.EMERGENCY = 0;
/**
 * Action must be taken immediately.
 *
 * @type Number
 */
exports.ALERT = 1;
/**
 * Critical condition.
 *
 * @type Number
 */
exports.CRITICAL = 2;
/**
 * Error condition.
 *
 * @type Number
 */
exports.ERROR = 3;
/**
 * Warning condition.
 *
 * @type Number
 */
exports.WARNING = 4;
/**
 * Normal but significant condition.
 *
 * @type Number
 */
exports.NOTICE = 5;
/**
 * Purely informational message.
 *
 * @type Number
 */
exports.INFO = 6;
/**
 * Application debug messages.
 *
 * @type Number
 */
exports.DEBUG = 7;
/**
 * Application access messages.
 *
 * @type Number
 */
exports.ACCESS = 8;
/**
 * prototype.
 */
Log.prototype = {
    /**
     * Start emitting "line" events.
     *
     * @api public
     */
    read: function(level) {
        var buf = '',
            self = this,
            stream = this.stream;
        stream.setEncoding('ascii');
        stream.on('data', function(chunk) {
            buf += chunk;
            if ('\n' != buf[buf.length - 1]) return;
            buf.split('\n').map(function(line) {
                if (!line.length) return;
                try {
                    var captures = line.match(/^\[([^\]]+)\] (\w+) (.*)/);
                    var obj = {
                        date: new Date(captures[1]),
                        level: exports[captures[2]],
                        levelString: captures[2],
                        msg: captures[3]
                    };
                    if (level >= obj.level) {
                      self.emit('line', obj);
                    }
                } catch (err) {
                    // Ignore
                }
            });
            buf = '';
        });
        stream.on('end', function() {
            self.emit('end');
        });
    },
    /**
     * Log output message.
     *
     * @param  {String} levelStr
     * @param  {String} msg
     * @api private
     */
    log: function(levelStr, msg) {
        if (exports[levelStr] <= this.level) {
            if (this.writing) {
              this.stream.write('[' + new Date().toUTCString() + ']' + ' ' + levelStr + ' ' + msg + '\n');
            }

            coloredLevelStr = '';
            if (levelStr === 'ERROR')   { coloredLevelStr = levelStr.red; }
            if (levelStr === 'WARNING') { coloredLevelStr = levelStr.magenta; }
            if (levelStr === 'NOTICE')  { coloredLevelStr = levelStr.green; }
            if (levelStr === 'INFO')    { coloredLevelStr = levelStr.blue; }
            if (levelStr === 'DEBUG')   { coloredLevelStr = levelStr.yellow; }
            // HACK: defer printing in non-developement modes
            if (this.printSync) {
              console.log(('[' + new Date().toUTCString() + ']').cyan + ' ' + coloredLevelStr + ' ' + msg);
            }
            else {
              setTimeout(function () {
                console.log(('[' + new Date().toUTCString() + ']').cyan + ' ' + coloredLevelStr + ' ' + msg);
              }, 0);
            }
        } else if (levelStr == 'ACCESS') {
          if (this.writing) {
            this.stream.write(msg + '\n');
          }
        }
    },
    /**
     * Log emergency `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    emergency: function(msg) {
        this.log('EMERGENCY', msg);
    },
    /**
     * Log alert `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    alert: function(msg) {
        this.log('ALERT', msg);
    },
    /**
     * Log critical `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    critical: function(msg) {
        this.log('CRITICAL', msg);
    },
    /**
     * Log error `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    error: function(msg) {
        this.log('ERROR', msg);
    },
    /**
     * Log warning `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    warning: function(msg) {
        this.log('WARNING', msg);
    },
    /**
     * Log notice `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    notice: function(msg) {
        this.log('NOTICE', msg);
    },
    /**
     * Log info `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    info: function(msg) {
        this.log('INFO', msg);
    },
    /**
     * Log debug `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    debug: function(msg) {
        this.log('DEBUG', msg);
    },
        /**
     * Log access `msg`.
     *
     * @param  {String} msg
     * @api public
     */
    access: function(msg) {
        this.log('ACCESS', msg);
    }
};
/**
 * Inherit from `EventEmitter`.
 */
Log.prototype.__proto__ = EventEmitter.prototype;
