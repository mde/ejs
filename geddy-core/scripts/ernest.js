var sys       = require ('sys');
var assert    = require('assert');

//Load utility libraries
GLOBAL.util = {};
GLOBAL.util.meta = require('geddy-util/lib/meta');
GLOBAL.util.string = require('geddy-util/lib/string');

ERNEST = {
  //pass and fail messages to be used in reporting success or failure 
  pass : 'PASSED :: ',
  fail : 'FAILED :: ',
  testCount: 0,
  failureCount: 0,
    
  //basic test setup
  setup : function() {
    return function() {
      //overload with your own goodness.
    }();
  },

  //tear down must be run at the completion of every test
  teardown : function(test) {
    sys.puts(this.pass + test);
    return function() {
      process.addListener("exit", function () {
        assert.equal(0, exitStatus);
      })();
    }
  },

  execute: function(tests) {
    sys.puts('');
    // Run tests -- additionally setting up custom failure message and calling setup() and teardown()
    for(e in tests) {
      if (e.match(/test/)) {
        this.setup();
        try {
          tests[e]();
          this.testCount += 1;
        } catch(err) {
          if (err) {
            this.onError(err)
            this.failureCount += 1;
          }
        };
        this.teardown(e);
      }
    }
    var passingTests = this.testCount - this.failureCount;
    sys.puts('');
    sys.puts(this.testCount + " total tests." + " " + passingTests + " PASSED." + " " + this.failureCount + " FAILED.");
    sys.puts('');
  },
  
  onError: function(err) {
    sys.puts(this.fail + e);
    sys.puts(err.stack);
  }
         
};

exports.ERNEST = ERNEST;
