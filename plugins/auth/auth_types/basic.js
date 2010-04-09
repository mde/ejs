var sys = require('sys');

var Basic = function () {
  this.authenticate =  function(controller, callback) {
    //sys.puts('basic auth');
    callback();
  };
};

exports.Basic = Basic;

