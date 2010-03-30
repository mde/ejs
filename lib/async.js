
var async = {};
async.AsyncChain = function (chain) {
  this.chain = [];
  var item;
  for (var i = 0; i < chain.length; i++) {
    item = chain[i];
    this.chain.push(new async.AsyncCall(
        this, item.func, item.args, item.callback));
  }
};

async.AsyncChain.prototype = new function () {
  this.runItem = function (item) {
    var args = item.args.concat(item.callback);
    item.func.apply(null, args);
  };
  this.next = function () {
    if (this.chain.length) {
      this.runItem(this.chain.shift());
    }
    else {
      this.last();
    }
  };
  this.run = this.next;
  this.last = function () {};
}();

async.AsyncCall = function (chain, func, args, callback) {
  this.func = func;
  this.args = args;
  this.callback = function () {
    callback.apply(null, arguments);
    chain.next();
  };
};

for (var p in async) { this[p] = async[p]; }
