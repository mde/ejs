
var Users = function () {
  this.respondsWith = ['text', 'json']
  
  this.index = function (params) {
    this.respond({method: 'index', params: params});
  };

  this.add = function (params) {
    this.respond({method: 'add', params: params});
  };

  this.create = function (params) {
    this.respond({method: 'create', params: params});
  };

  this.show = function (params) {
    this.respond({method: 'show', params: params});
  };
  
  this.update = function (params) {
    this.respond({method: 'update', params: params});
  };

  this.remove = function (params) {
    this.respond({method: 'remove', params: params});
  };

};

exports.Users = Users;

