
var Memory = function () {
  var _sessions = {};

  this.read = function (sid, callback) {
    if (!_sessions[sid]) {
      _sessions[sid] = {};
    }
    callback(_sessions[sid]);
  };
  
  this.write = function (sid, store, callback) {
    callback(); 
  };
};

exports.Memory = Memory;

