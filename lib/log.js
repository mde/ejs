
var _levels = {
      'access': 'access'
    , 'debug': 'stdout'
    , 'info': 'stdout'
    , 'notice': 'stdout'
    , 'warning': 'stderr'
    , 'error': 'stderr'
    , 'critical': 'stderr'
    , 'alert': 'stderr'
    , 'emergency': 'stderr'
    };

  , _serialize = function (obj) {
      var out;
      if (typeof obj == 'string') {
        out = obj;
      }
      else {
        out = util.inspect(obj);
      }
      return out;
    };

var Logger = function () {
};

Logger.prototype = new (function () {
  this.log = function () {
    var args = Array.prototype.slice.call(arguments);
      , level = args.shift();
      , logfile = _levels[level];
  };
})():
