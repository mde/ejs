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

var tests = {

  'test serialized object': function () {
    obj = {foo: 'bar'};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo>bar</foo></object>';
    assert.equal(res, xml);
  }

, 'test array of numbers': function () {
    obj = [1, 2, 3];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><numbers type="array"><number>1</number><number>2</number><number>3</number></numbers>';
    assert.equal(res, xml);
  }

, 'test array of strings': function () {
    obj = ['foo', 'bar'];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><strings type="array"><string>foo</string><string>bar</string></strings>';
    assert.equal(res, xml);
  }

, 'test array of mixed datatypes': function () {
    obj = ['foo', 1];
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><records type="array"><record>foo</record><record>1</record></records>';
    assert.equal(res, xml);
  }

, 'test array property of an object': function () {
    obj = {foo: ['bar', 'baz']};
    xml = serialize(obj);
    res = '<?xml version="1.0" encoding="UTF-8"?><object><foo type="array"><foo>bar</foo><foo>baz</foo></foo></object>';
    assert.equal(res, xml);
  }

};

module.exports = tests;

