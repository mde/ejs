
var geddy = new function () {
  this.util = {};
  this.util.meta = require('geddy-util/lib/meta');
  this.util.string = require('geddy-util/lib/string');
  this.util.date = require('geddy-util/lib/date');
}();

module.exports = geddy;
