var sys = require('sys');

var async = {};

/*
AsyncChain -- performs a list of asynchronous calls in a desired order.
Optional "last" method can be set to run after all the items in the
chain have completed.

  // Example usage
  var asyncChain = new async.AsyncChain([
    {
      func: app.trainToBangkok,
      args: [geddy, neil, alex],
      callback: null, // No callback for this action
    },
    {
      func: fs.readdir,
      args: [config.dirname + '/thailand/express'],
      callback: function (err, result) {
        if (err) {
          // Bail out completely
          chain.abort();
        }
        else if (result.theBest) {
          // Skip to the 'last' function
          chain.shortCircuit();
        }
        else {
          // Otherwise do some other stuff and
          // then go to the next link
        }
      } 
    },
    {
      func: child_process.exec,
      args: ['ls ./'],
      callback: this.hitTheStops
    }
  ]);

  // Function to exec after all the links in the chain finish
  asyncChain.last = function () { // Do some final stuff };

  // Start the async-chain
  asyncChain.run();
  
*/
async.AsyncChain = function (chain) {
  this.chain = [];
  this.currentItem = null;
  this.shortCircuited = false;
  this.aborted = false;

  var item;
  for (var i = 0; i < chain.length; i++) {
    item = chain[i];
    this.chain.push(new async.AsyncCall(
        item.func, item.args, item.callback));
  }
};

async.AsyncChain.prototype = new function () {
  this.runItem = function (item) {
    // Reference to the current item in the chain -- used
    // to look up the callback to execute with execCallback
    this.currentItem = item;
    // Scopage
    var _this = this;
    // Pass the arguments passed to the current async call
    // to the callback executor, execute it in the correct scope
    var executor = function () {
      _this.execCallback.apply(_this, arguments);
    };
    // Append the callback executor to the end of the arguments
    // Node helpfully always has the callback func last
    var args = item.args.concat(executor);
    // Run the async call
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

  this.execCallback = function () {
    // Look up the callback, if any, specified for this async call
    var callback = this.currentItem.callback;
    // If there's a callback, do it
    if (callback && typeof callback == 'function') {
      // Add a locally scoped reference to this chain obj in the
      // execution scope of the callback -- how horrible is this, exactly?
      // Other interesting ways to allow access to the chain from inside
      // a callback might be ... setting callback.chain = this, and then using
      // arguments.callee.chain from inside the callback
      with ({chain: this}) {
        callback.apply(null, arguments);
      }
    }

    this.currentItem.finished = true;

    // If one of the async callbacks called chain.shortCircuit,
    // skip to the 'last' function for the chain
    if (this.shortCircuited) {
      this.last();
    }
    // If one of the async callbacks called chain.abort,
    // bail completely out
    else if (this.aborted) {
      return;
    }
    // Otherwise run the next item, if any, in the chain
    else {
      this.next();
    }
  }

  // Short-circuit the chain, jump straight to the 'last' function
  this.shortCircuit = function () {
    this.shortCircuited = true;
  }

  // Stop execution of the chain, bail completely out
  this.abort = function () {
    this.aborted = true;
  }

  // Kick off the chain by grabbing the first item and running it
  this.run = this.next;

  // Function to run when the chain is done -- default is a no-op
  this.last = function () {};

}();

async.AsyncGroup = function (group) {
  var item;
  var callback;
  var args;
  
  this.group = [];
  this.outstandingCount = 0;

  for (var i = 0; i < group.length; i++) {
    item = group[i];
    this.group.push(new async.AsyncCall(
        item.func, item.args, item.callback));
    this.outstandingCount++;
  }
  
};

/*
Simpler way to group async calls -- doesn't ensure completion order,
but still has a "last" method called when the entire group of calls
have completed.
*/
async.AsyncGroup.prototype = new function () {
  this.run = function () {
    var _this = this;
    var group = this.group;
    var item;
    var createCallback = function (item) {
      return function () {
        if (item.callback) {
          item.callback.apply(null, arguments);
        }
        _this.finish.call(_this);
      }
    };
  
    for (var i = 0; i < group.length; i++) {
      item = group[i];
      callback = createCallback(item);
      args = item.args.concat(callback);
      // Run the async call
      item.func.apply(null, args);
    }
  };

  this.finish = function () {
    this.outstandingCount--;
    if (!this.outstandingCount) {
      this.last();
    };
  };

  this.last = function () {};

};

async.AsyncCall = function (func, args, callback) {
  this.func = func;
  this.args = args;
  this.callback = callback || null;
};

for (var p in async) { this[p] = async[p]; }
