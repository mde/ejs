if (typeof geddy == 'undefined') { geddy = {}; }
if (typeof geddy.model == 'undefined') { geddy.model = {}; }
geddy.model = require('../lib/model');
geddy.util.date = require('../../geddy-util/lib/date');
geddy.util.meta = require('../../geddy-util/lib/meta');
geddy.util.string = require('../../geddy-util/lib/string');

global.User = function () {
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
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

geddy.model.registerModel('User');

var testCreateUser = new function () {
  var _params = {
      login: 'zzz',
      password: 'asdf',
      confirmPassword: 'asdf',
      firstName: 'Neil'
    };

  this.testValid = function () {
    var user = User.create(_params);
    assert.ok(user.valid());
  };

  this.testShortLogin = function () {
    _params.login = 'zz'; // Too short, invalid
    var user = User.create(_params);
    assert.ok(typeof user.errors.login != 'undefined');
  };

  this.testInvalidLoginWithCustomMessage = function () {
    _params.login = '2112'; // Contains numbers, invalid 
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(user.errors.login, 'Subdivisions!');
  };

  this.testNoLogin = function () {
    delete _params.login; // Contains numbers, invalid 
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(typeof user.errors.login != 'undefined');

    _params.login = 'zzz'; // Restore to something valid
  };

  this.testNoConfirmPassword = function () {
    _params.confirmPassword = 'fdsa';
    var user = User.create(_params);
    // Error message should be customized
    assert.ok(typeof user.errors.password != 'undefined');

    _params.confirmPassword = 'asdf'; // Restore to something valid
  };

}();

logan.run(testCreateUser);

