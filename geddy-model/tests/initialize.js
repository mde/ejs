// A useful shortcut for our test code
var wmAsserts = windmill.controller.asserts;

// Use this to set the order you want your tests to run
var registeredTests = [
  'testCreateUser',
  'testDatatypes'
];

// Register top-level test namespaces in the order
// we want to run them
windmill.jsTest.register(registeredTests);

// Set this to true to run *only* the registered tests
// Defaults to false, so registered tests run first --
// all others run in the order they're found by the parser
windmill.jsTest.runRegisteredTestsOnly = true;

// Pull in the code for all the tests
windmill.jsTest.require('create_user.js');
windmill.jsTest.require('datatypes.js');


