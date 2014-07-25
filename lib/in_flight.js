var utils = require('utilities')
  , EventEmitter = require('events').EventEmitter
  , InFlight
  , InFlightEntry;

var _timeout = null;

InFlightEntry = function (props) {
  this.id = utils.string.uuid();
  utils.mixin(this, props);
  EventEmitter.call(this);
};
InFlightEntry.prototype = Object.create(EventEmitter.prototype);

InFlight = function () {
  this.entries = new utils.SortedCollection();
  this.timeoutId = null;
};

InFlight.prototype = new (function () {

  this.addEntry = function (data) {
    var entry = new InFlightEntry(data);
    this.entries.addItem(entry.id, entry);

    if (_timeout) {
      entry.timeoutId = setTimeout(function () {
        entry.emit('timeout', _timeout);
        // If there's no controller to respond, at least
        // output something useful
        if (!entry.controller) {
          entry.response.send('Request timed out', 504);
        }
      }, _timeout);
    }

    return entry;
  };

  this.setEntry = function (id, obj) {
    this.entries.setItem(id, obj);
  };

  this.removeEntry = function (id) {
    var entry = this.getEntry(id);
    clearTimeout(entry.timeoutId);
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

  this.setTimeout = function (t) {
    _timeout = t;
  };

})();

module.exports = new InFlight();

