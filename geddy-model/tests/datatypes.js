logan.namespace('geddy.util');
logan.namespace('geddy.model');

geddy.model = require('../lib/model');
geddy.util.date = require('../../geddy-util/lib/date');
geddy.util.meta = require('../../geddy-util/lib/meta');
geddy.util.string = require('../../geddy-util/lib/string');

global.ByTor = function () {
  this.property('numberProp', 'number');
  this.property('intProp', 'int');
  this.property('objectProp', 'object');
  this.property('arrayProp', 'array');
  this.property('dateProp', 'date');
  this.property('datetimeProp', 'date');
};

geddy.model.registerModel('ByTor');

var testDatatypes = new function () {
  this.testAllOptional = function () {
    var params = {};
    var byTor = ByTor.create(params);
    assert.ok(byTor.valid());
  };

  this.testNumber = function () {
    var byTor;
    // Actual number, valid
    byTor = ByTor.create({numberProp: 2112});
    assert.ok(byTor.valid());

    // Numeric string, valid
    byTor = ByTor.create({numberProp: '2112'});
    assert.ok(byTor.valid());

    // Non-numeric string, error
    byTor = ByTor.create({numberProp: 'Snow Dog'});
    assert.notStrictEqual(byTor.errors.numberProp, undefined);
  
  };
  
  this.testInt = function () {
    var byTor;
    // Actual int, valid
    byTor = ByTor.create({intProp: 2112});
    assert.ok(byTor.valid());

    // Actual int, valid
    byTor = ByTor.create({intProp: '2112'});
    assert.ok(byTor.valid());

    // Float with zero decimal, valid
    byTor = ByTor.create({intProp: 2112.0});
    assert.ok(byTor.valid());

    // Float with greater-than-zero decimal, error
    byTor = ByTor.create({intProp: 2112.2112});
    assert.notStrictEqual(byTor.errors.intProp, undefined);

    // Non-numeric string, error
    byTor = ByTor.create({intProp: 'away from here'});
    assert.notStrictEqual(byTor.errors.intProp, undefined);
  
  };
  
  this.testObject = function () {
    var byTor;
    // Actual Object, valid
    byTor = ByTor.create({objectProp: {}});
    assert.ok(byTor.valid());

    // Sure, technically Arrays are Objects, but this still isn't right
    byTor = ByTor.create({objectProp: []});
    assert.notStrictEqual(byTor.errors.objectProp, undefined);

    // string, should fail
    byTor = ByTor.create({objectProp: 'As gray traces of dawn ...'});
    assert.notStrictEqual(byTor.errors.objectProp, undefined);

  };

  this.testArray = function () {
    var byTor;
    // Actual Array, valid
    byTor = ByTor.create({arrayProp: []});
    assert.ok(byTor.valid());

    // Sure, technically Arrays are Objects, but this still isn't right
    byTor = ByTor.create({arrayProp: {}});
    assert.notStrictEqual(byTor.errors.arrayProp, undefined);

    // string, should fail
    byTor = ByTor.create({arrayProp: 'As gray traces of dawn ...'});
    assert.notStrictEqual(byTor.errors.arrayProp, undefined);

  };

  this.testDate = function () {
    var byTor;
    var dates = [
        '12/27/1968'
      , '12-27-1968'
      , '12.27.1968'
      , '1968/12/27'
      , '1968-12-27'
      , '1968.12.27'
      , [1968, 12, 27]
      , new Date(1968, 11, 27)
      , new Date('12/27/1968')
      , 'Fri, 27 Dec 1968'
    ];
    var dt;
    for (var i = 0, ii = dates.length; i < ii; i++) {
      dt = dates[i];
      byTor = ByTor.create({dateProp: dt});
      assert.ok(byTor.valid(), 'Testing valid');
      assert.equal(byTor.dateProp.getFullYear(), 1968, 'Testing getFullYear');
      assert.equal(byTor.dateProp.getMonth(), 11, 'Testing getMonth'); // Zero-based
      assert.equal(byTor.dateProp.getDate(), 27, 'Testing getDate');
    }
  
  };

  this.testDatetime = function () {
    var byTor;
    var dates, dt;
    // Dates with no set time -- time should be set to 12 midnight
    dates = [
      '1968/12/27'
      , '1968-12-27'
      , '1968.12.27'
      , [1968, 12, 27]
      , new Date(1968, 11, 27)
      , new Date('12/27/1968')
      , 'Fri, 27 Dec 1968'
    ];
    for (var i = 0, ii = dates.length; i < ii; i++) {
      dt = dates[i];
      byTor = ByTor.create({datetimeProp: dt});
      assert.ok(byTor.valid());
      assert.equal(byTor.datetimeProp.getFullYear(), 1968);
      assert.equal(byTor.datetimeProp.getMonth(), 11); // Zero-based
      assert.equal(byTor.datetimeProp.getDate(), 27);
      assert.equal(byTor.datetimeProp.getHours(), 0);
      assert.equal(byTor.datetimeProp.getMinutes(), 0);
      assert.equal(byTor.datetimeProp.getSeconds(), 0);
    }
    // Dates with times
    dates = [
      '1968-12-27 16:10:03'
      , [1968, 12, 27, 16, 10, 3]
      , new Date(1968, 11, 27, 16, 10, 3)
      , 'Fri, 27 Dec 1968 16:10:03'
    ];
    for (var i = 0, ii = dates.length; i < ii; i++) {
      dt = dates[i];
      byTor = ByTor.create({datetimeProp: dt});
      assert.ok(byTor.valid());
      assert.equal(byTor.datetimeProp.getFullYear(), 1968);
      assert.equal(byTor.datetimeProp.getMonth(), 11); // Zero-based
      assert.equal(byTor.datetimeProp.getDate(), 27);
      assert.equal(byTor.datetimeProp.getHours(), 16);
      assert.equal(byTor.datetimeProp.getMinutes(), 10);
      assert.equal(byTor.datetimeProp.getSeconds(), 3);
    }
  
  };

}();

logan.run(testDatatypes);

