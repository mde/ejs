
var Users = function () {
  this.index = function (params) {
    this.respond('index: ' + JSON.stringify(params));
  };

  this.add = function (params) {
    this.respond('add: ' + JSON.stringify(params));
  };

  this.create = function (params) {
    this.respond('create: ' + JSON.stringify(params));
  };

  this.show = function (params) {
    this.respond('show: ' + JSON.stringify(params));
  };
  
  this.update = function (params) {
    this.respond('update: ' + JSON.stringify(params));
  };

  this.remove = function (params) {
    this.respond('remove: ' + JSON.stringify(params));
  };

};

exports.Users = Users;

