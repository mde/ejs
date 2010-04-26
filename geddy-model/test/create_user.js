
var User = function () {
  this.property('login', 'String', {required: true});
  this.property('password', 'String', {required: true});
  this.property('lastName', 'String');
  this.property('firstName', 'String');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  this.validatesConfirmed('password', 'confirmPassword');
};

User.prototype.someMethod = function () {
  // Do some stuff on a User instance
};

model.registerModel('User');

var testCreateUser = new function () {
  var _params = {
      login: 'zzz',
      password: 'asdf',
      confirmPassword: 'asdf',
      firstName: 'Neil'
    };

  //this.setup = function () {};

  this.testValid = function () {
    var user = User.create(_params);
    jum.assertTrue(user.valid());
  };

  this.testShortLogin = function () {
    _params.login = 'zz'; // Too short, invalid
    var user = User.create(_params);
    jum.assertNotUndefined(user.errors.login);
  };

  this.testInvalidLoginWithCustomMessage = function () {
    _params.login = '2112'; // Contains numbers, invalid 
    var user = User.create(_params);
    // Error message should be customized
    jum.assertEquals(user.errors.login, 'Subdivisions!');
  };

  this.testNoLogin = function () {
    delete _params.login; // Contains numbers, invalid 
    var user = User.create(_params);
    // Error message should be customized
    jum.assertNotUndefined(user.errors.login);

    _params.login = 'zzz'; // Restore to something valid
  };

  this.testNoConfirmPassword = function () {
    _params.confirmPassword = 'fdsa';
    var user = User.create(_params);
    // Error message should be customized
    jum.assertNotUndefined(user.errors.password);

    _params.confirmPassword = 'asdf'; // Restore to something valid
  };

  //this.teardown = function () {};

}();

