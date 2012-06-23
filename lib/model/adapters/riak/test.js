var path = require('path')
  , lib = '../../../../lib'
  , model
  , assert = require('assert')
  , tests
  , Riak
  , currentId
  , nameList
  , idList
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

nameList = [
  'Neil'
, 'Alex'
, 'Geddy'
];

idList = [];

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
      if (err) {
        throw err;
      }
      // This is fucking ridiculous, deletes cause lookups to fail
      // for a while: https://issues.basho.com/show_bug.cgi?id=1269
      setTimeout(next, 5000);
    });
  }

, 'test save multiple items': function (next) {
    var save = function () {
      var name = nameList.shift()
        , user;
      if (name) {
        _params.firstName = name;
        user = User.create(_params);
        assert.ok(user.isValid());
        user.save(function (err, data) {
          assert.ok(data.isValid());
          // Add to the list for use in lookup tests
          idList.push(data.id);
          save();
        });
      }
      else {
        next();
      }
    };
    save();
  }

, 'test load multiple items': function (next) {
    User.load(function (err, data) {
      if (err) {
        throw err;
      }
      assert.ok(data.length > 1); // Should have three
      assert.ok(data[2].isValid());
      next();
    });
  }

, 'test filter for specific items': function (next) {
    User.load({firstName: 'Alex'}, function (err, data) {
      if (err) {
        throw err;
      }
      assert.ok(data.length == 1);
      assert.ok(data[0].isValid());
      assert.ok(data[0].id == idList[1]);
      next();
    });
  }

, 'test remove all items': function (next) {
    User.load(function (err, data) {
      var ids = data.map(function (item) {
        return item.id;
      });
      var remove = function () {
        var id = ids.shift();
        if (id) {
          User.remove(id, function (err, data) {
            if (err) {
              throw err;
            }
            remove();
          });
        }
        else {
          // This is fucking ridiculous, deletes cause lookups to fail
          // for a while: https://issues.basho.com/show_bug.cgi?id=1269
          setTimeout(next, 5000);
        }
      };
      remove();
    });
  }

};

module.exports = tests;
