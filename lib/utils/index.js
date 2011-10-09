var utils = new (function () {

  this.objectToString = function (object) {
    var objectArray = [];
    for (var key in object) {
      if ('object' == typeof object[key]) {
        objectArray.push(this.objectToString(object[key]));
      } else {
        objectArray.push(key + '=' + object[key]);
      }
    }
    return objectArray.join(', ');
  };

})();

utils.MessageParser = function (dispatch, dispatchScope, notParsedHandler) {
  this._data = '';
  this.dispatch = dispatch;
  this.dispatchScope = dispatchScope;
  this.notParsedHandler = notParsedHandler;
};

utils.MessageParser.prototype = new (function () {
  this.handle = function (d) {
    var arr
      , msg;

    this._data += d;
    arr = this._data.split('\n');
    for (var i = 0, ii = (arr.length - 1); i < ii; i++) {
      if (arr[i]) {
        msg = null;
        try {
          msg = JSON.parse(arr[i]);
        }
        catch (e) {}

        if (msg && msg.method && this.dispatch[msg.method]) {
          this.dispatch[msg.method].call(this.dispatchScope, msg);
        }
        else {
          if (typeof this.notParsedHandler == 'function') {
            this.notParsedHandler(arr[i]);
          }
        }
      }
    }
    this._data = (arr[arr.length - 1] || '');
  };
})();

utils.mixin = (function () {
  var _mix = function (targ, src, merge) {
    for (var p in src) {
      // Don't copy stuff from the prototype
      if (src.hasOwnProperty(p)) {
        if (merge &&
            // Assumes the source property is an Object you can
            // actually recurse down into
            (typeof src[p] == 'object') &&
            (src[p] !== null) &&
            !(src[p] instanceof Array)) {
          // Create the source property if it doesn't exist
          // TODO: What if it's something weird like a String or Number?
          if (typeof targ[p] == 'undefined') {
            targ[p] = {};
          }
          _mix(targ[p], src[p], merge); // Recurse
        }
        // If it's not a merge-copy, just set and forget
        else {
          targ[p] = src[p];
        }
      }
    }
  };

  return function () {
    var args = Array.prototype.slice.apply(arguments),
        merge = false,
        targ, sources;
    if (args.length > 2) {
      if (typeof args[args.length - 1] == 'boolean') {
        merge = args.pop();
      }
    }
    targ = args.shift();
    sources = args;
    for (var i = 0, ii = sources.length; i < ii; i++) {
      _mix(targ, sources[i], merge);
    }
    return targ;
  };
})();

module.exports = utils;
