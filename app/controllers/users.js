var sys = require('sys');

var Users = function () {
  this.index = function (params) {
    this.render(JSON.stringify(params));
  };
};

exports.Users = Users;

