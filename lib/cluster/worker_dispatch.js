var dispatch = {
  config: function (msg) {
    this.configure(msg.data);
    this.start();
  }
};

module.exports = dispatch;

