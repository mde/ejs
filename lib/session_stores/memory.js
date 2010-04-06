
var Memory = function (callback) {
  this.setup(callback);
};

Memory.prototype = new function () {
  var _sessions = {};
  
  this.setup = function (callback) {
    callback();
  };

  this.read = function (sid, callback) {
    if (!_sessions[sid]) {
      _sessions[sid] = {};
    }
    callback(_sessions[sid]);
  };
  
  this.write = function (sid, store, callback) {
    callback(); 
  };

}();

exports.Memory = Memory;

