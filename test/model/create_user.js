// Load the basic Geddy toolkit
require('../../lib/geddy');

geddy.config = {
  i18n: {
    defaultLocale: 'en-us'
  }
};

var model = require('../../lib/model')
  , assert = require('assert')
  , tests
  , _params;

geddy.model = model;

var User = function () {
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

_params = {
  login: 'zzz',
  password: 'asdf',
  confirmPassword: 'asdf',
  firstName: 'Neil'
};

var tests = {

  'test validity': function () {
    var user = User.create(_params);
    assert.ok(user.isValid());
  }


, 'test login is too short': function () {
    _params.login = 'zz'; // Too short, invalid
    var user = User.create(_params);
    assert.ok(typeof user.errors.login != 'undefined');
  }

, 'test invalid login with custom error message': function () {
    _params.login = '2112'; // Contains numbers, invalid
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(user.errors.login, 'Subdivisions!');
  }

, 'test missing login': function () {
    delete _params.login; // Contains numbers, invalid
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(typeof user.errors.login != 'undefined');

    _params.login = 'zzz'; // Restore to something valid
  }

, 'test no password confirmation': function () {
    _params.confirmPassword = 'fdsa';
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(typeof user.errors.password != 'undefined');

    _params.confirmPassword = 'asdf'; // Restore to something valid
  }

};

module.exports = tests;

