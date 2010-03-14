var sys = require('sys');

var Users = function () {
  this.index = function (params) {
    sys.puts(this.constructor.prototype);
    this.render(JSON.stringify(params));
  };
};

exports.Users = Users;

