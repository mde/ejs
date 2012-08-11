var MessageParser = function (handler) {
  this._data = '';
  this.handler = handler;
};

MessageParser.prototype = new (function () {
  this.parse = function (d) {
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

        if (msg) {
          this.handler(msg);
        }
        /*
        if (msg && msg.method && this.dispatch[msg.method]) {
          this.dispatch[msg.method].call(this.dispatchScope, msg);
        }
        else {
          if (typeof this.notParsedHandler == 'function') {
            this.notParsedHandler(arr[i]);
          }
        }
        */
      }
    }
    this._data = (arr[arr.length - 1] || '');
  };
})();

module.exports.MessageParser = MessageParser;

