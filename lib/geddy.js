
var geddy = global.geddy || {}
  , utils;

global.geddy = geddy;
utils = require('./utils/index');
// Hang all the util namespaces on the global geddy
for (var p in utils) {
  geddy[p] = utils[p];
}
// Could also be used as export/local
module.exports = geddy;

