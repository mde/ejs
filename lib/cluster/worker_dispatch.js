var dispatch = {
  config: function (msg) {
    this.configure(msg.data);
  }
};

module.exports = dispatch;

