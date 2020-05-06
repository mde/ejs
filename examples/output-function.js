/*
 * Believe it or not, you can declare and use functions in EJS templates too.
 */

var ejs = require('../');
var read = require('fs').readFileSync;
var join = require('path').join;
var path = join(__dirname, '/output-function.ejs');
var data = {
  users: [
    {name: 'Tobi', age: 2, species: 'ferret'},
    {name: 'Loki', age: 2, species: 'ferret'},
    {name: 'Jane', age: 6, species: 'ferret'}
  ]
};

var ret = ejs.compile(read(path, 'utf8'), {
  root: [join(__dirname, '..'), __dirname],
  filename: path,
  outputFunctionName: 'echo'
})(data);

console.log(ret);
