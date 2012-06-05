// Load the basic Geddy toolkit
require('../lib/geddy');
var XML = geddy.XML
  , assert = require('assert')
  , obj
  , xml
  , res;

var serialize = function (o) {
  return XML.stringify(o, {whitespace: false});
};

var tests = new (function () {

  this.testObject = function () {
    obj = {foo: 'bar'};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo>bar</foo></object>';
    assert.equal(res, xml);
  };

  this.testArrayNumbers = function () {
    obj = [1, 2, 3];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><numbers type="array"><number>1</number><number>2</number><number>3</number></numbers>';
    assert.equal(res, xml);
  };

  this.testArrayStrings = function () {
    obj = ['foo', 'bar'];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><strings type="array"><string>foo</string><string>bar</string></strings>';
    assert.equal(res, xml);
  };

  this.testArrayMixed = function () {
    obj = ['foo', 1];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><records type="array"><record>foo</record><record>1</record></records>';
    assert.equal(res, xml);
  };

  this.testArrayPropOfObject = function () {
    obj = {foo: ['bar', 'baz']};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo type="array"><foo>bar</foo><foo>baz</foo></foo></object>';
    assert.equal(res, xml);
  };

})();

for (var p in tests) {
  if (typeof tests[p] == 'function') {
    console.log('Running ' + p);
    tests[p]();
  }
}


