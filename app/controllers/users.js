
var Users = function () {
  this.index = function (params) {
    this.respond(JSON.stringify(params));
  };
};

exports.Users = Users;

