/*
 * Advanced use of "include", fast layout, and dynamic rendering components.
 */

var ejs = require('../../lib/ejs');
var read = require('fs').readFileSync;
var join = require('path').join;
var path = join(__dirname, '/index.ejs');

var ret = ejs.compile(read(path, 'utf8'), {filename: path})({title: 'use slot'});

console.log(ret);
