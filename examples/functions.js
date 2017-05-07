/*
 * Believe it or not, you can declare and use functions in EJS templates too.
 */

var ejs = require('../');
var read = require('fs').readFileSync;
var join = require('path').join;
var path = join(__dirname, '/functions.ejs');
var data = {
  users: [
    { name: 'Tobi', age: 2, species: 'ferret' },
    { name: 'Loki', age: 2, species: 'ferret' },
    { name: 'Jane', age: 6, species: 'ferret' }
  ]
};

var ret = ejs.compile(read(path, 'utf8'), {filename: path})(data);

console.log(ret);
