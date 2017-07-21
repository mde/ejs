/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var ejs = require('..');
ejs.enableSnippets();
var fs = require('fs');
var read = fs.readFileSync;
var assert = require('assert');
var path = require('path');
var LRU = require('lru-cache');

try {
  fs.mkdirSync(__dirname + '/tmp');
} catch (ex) {
  if (ex.code !== 'EEXIST') {
    throw ex;
  }
}

// From https://gist.github.com/pguillory/729616
function hook_stdio(stream, callback) {
  var old_write = stream.write;

  stream.write = (function() {
    return function(string, encoding, fd) {
      callback(string, encoding, fd);
    };
  })(stream.write);

  return function() {
    stream.write = old_write;
  };
}

/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8');
}

/**
 * User fixtures.
 */

var users = [];
users.push({name: 'geddy'});
users.push({name: 'neil'});
users.push({name: 'alex'});

suite('ejs.snippet', function () {

  test('work when nested', function () {
    var file = 'test/fixtures/snippet.ejs';
    assert.equal(ejs.render(fixture('snippet.ejs'), {pets: users}, {filename: file, cache:true,}),        fixture('snippet.html'));
  });
  
});

