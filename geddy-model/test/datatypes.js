
var ByTor = function () {
  this.property('rush', 'number');
  this.property('flyByNight', 'int');
  this.property('caressOfSteel', 'object');
  this.property('farewellToKings', 'array');
};

model.registerModel('ByTor');

var testDatatypes = new function () {
  this.testAllOptional = function () {
    var params = {};
    var byTor = ByTor.create(params);
    jum.assertTrue(byTor.valid());
  };

  this.testNumber = function () {
    var byTor;
    // Actual number, valid
    byTor = ByTor.create({rush: 2112});
    jum.assertTrue(byTor.valid());

    // Numeric string, valid
    byTor = ByTor.create({rush: '2112'});
    jum.assertTrue(byTor.valid());

    // Non-numeric string, error
    byTor = ByTor.create({rush: 'Snow Dog'});
    jum.assertNotUndefined(byTor.errors.rush);
  
  };
  
  this.testInt = function () {
    var byTor;
    // Actual int, valid
    byTor = ByTor.create({flyByNight: 2112});
    jum.assertTrue(byTor.valid());

    // Actual int, valid
    byTor = ByTor.create({flyByNight: '2112'});
    jum.assertTrue(byTor.valid());

    // Float with zero decimal, valid
    byTor = ByTor.create({flyByNight: 2112.0});
    jum.assertTrue(byTor.valid());

    // Float with greater-than-zero decimal, error
    byTor = ByTor.create({flyByNight: 2112.2112});
    jum.assertNotUndefined(byTor.errors.flyByNight);

    // Non-numeric string, error
    byTor = ByTor.create({flyByNight: 'away from here'});
    jum.assertNotUndefined(byTor.errors.flyByNight);
  
  };
  
  this.testObject = function () {
    var byTor;
    // Actual Object, valid
    byTor = ByTor.create({caressOfSteel: {}});
    jum.assertTrue(byTor.valid());

    // Sure, technically Arrays are Objects, but this still isn't right
    byTor = ByTor.create({caressOfSteel: []});
    jum.assertNotUndefined(byTor.errors.caressOfSteel);

    // string, should fail
    byTor = ByTor.create({caressOfSteel: 'As gray traces of dawn ...'});
    jum.assertNotUndefined(byTor.errors.caressOfSteel);

  };

  this.testArray = function () {
    var byTor;
    // Actual Array, valid
    byTor = ByTor.create({farewellToKings: []});
    jum.assertTrue(byTor.valid());

    // Sure, technically Arrays are Objects, but this still isn't right
    byTor = ByTor.create({farewellToKings: {}});
    jum.assertNotUndefined(byTor.errors.farewellToKings);

    // string, should fail
    byTor = ByTor.create({farewellToKings: 'As gray traces of dawn ...'});
    jum.assertNotUndefined(byTor.errors.farewellToKings);

  };

}();

