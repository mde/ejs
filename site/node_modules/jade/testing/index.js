
/**
 * Module dependencies.
 */

var jade = require('..')
  , fs = require('fs')
  , read = fs.readFileSync;

var str = read('testing/index.jade', 'utf8');

var fn = jade.compile(str, { pretty: true, debug: true, compileDebug: false, filename: 'testing/index.jade' });

console.log(fn());