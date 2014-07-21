var utils = require('utilities');

var InFlight = function () {
  this.entries = new utils.SortedCollection();
};

InFlight.prototype = new (function () {

  this.addEntry = function (data) {
    var id = utils.string.uuid();
    this.entries.addItem(id, data);
    return id;
  };

  this.updateEntry = function (id, obj) {
    utils.mixin(this.entries.getItem(id), obj);
  };

  this.removeEntry = function (id) {
    this.entries.removeItem(id);
  };

  this.getEntry = function (id) {
    return this.entries.getItem(id);
  };

  this.getCount = function () {
    return this.entries.count;
  };

  this.each = function (handler) {
    this.entries.each(handler);
  };

})();

module.exports = new InFlight();

