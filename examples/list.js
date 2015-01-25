/*
 * This example demonstrates how to use Array.prototype.forEach() in an EJS
 * template.
 */

var ejs = require('../')
  , read = require('fs').readFileSync
  , join = require('path').join
  , str = read(join(__dirname, '/list.ejs'), 'utf8');

var ret = ejs.compile(str)({
  names: ['foo', 'bar', 'baz']
});

console.log(ret);
