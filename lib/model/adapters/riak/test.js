var path = require('path')
  , lib = '../../../../lib'
  , model
  , assert = require('assert')
  , tests
  , Riak
  , currentId
  , User
  , _params;

// Load the basic Geddy toolkit
require(path.join(lib, 'geddy'));

geddy.config = {
  i18n: {
    defaultLocale: 'en-us'
  }
, db: {
    riak: {
    }
  }
};

model = require(path.join(lib, 'model'));
assert = require('assert');
Riak = require('./index').Riak;

model.adapter = {};
geddy.model = model;

User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('confirmPassword', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  this.validatesConfirmed('password', 'confirmPassword');
};

User.prototype.someMethod = function () {
  // Do some stuff on a User instance
};

User = geddy.model.register('User', User);

geddy.model.adapter.User = new Riak({model: 'User'});

_params = {
  login: 'zzz'
, password: 'asdf'
, confirmPassword: 'asdf'
, firstName: 'Neil'
};

tests = {
  'test validate and save item': function (next) {
    var user = User.create(_params);
    assert.ok(user.isValid());
    user.save(function (err, data) {
      assert.ok(data.isValid());
      currentId = data.id;
      next();
    });
  }

, 'test load item': function (next) {
    User.load(currentId, function (err, data) {
      assert.ok(data.isValid());
      next();
    });
  }

, 'test remove item': function (next) {
    User.remove(currentId, function (err, data) {
      assert.ok(!err);
      next();
    });
  }

};

module.exports = tests;
