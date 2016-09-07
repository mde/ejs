/*
 * This example demonstrates how to use Array.prototype.forEach() in an EJS
 * template.
 */

var ejs = require('../');
var read = require('fs').readFileSync;
var join = require('path').join;
var str = read(join(__dirname, '/list.ejs'), 'utf8');

var ret = ejs.compile(str)({
  names: ['foo', 'bar', 'baz']
});

console.log(ret);
