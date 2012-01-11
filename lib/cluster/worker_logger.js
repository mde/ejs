
var Logger = function (worker) {
  var self = this
    , types = [
        'debug'
      , 'info'
      , 'notice'
      , 'warning'
      , 'error'
      , 'critical'
      , 'alert'
      , 'emergency'
      , 'access'
      ]
    , type
    , loggerCreator = function (t) {
        return function (msg) {
          self.worker.sendMessage({method: 'log', logType: t, message: msg});
        };
      };

  this.worker = worker;

  for (var i = 0, ii = types.length; i < ii; i++) {
    type = types[i];
    this[type] = loggerCreator(type);
  }
};

module.exports.Logger = Logger;

