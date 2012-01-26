var dispatch = {
  config: function (msg) {
    this.configure(msg.data);
  }
, shutdown: function (msg) {
    this.shutdown(msg.data);
  }
, retire: function (msg) {
    this.retire(msg.data);
  }
};

module.exports = dispatch;

