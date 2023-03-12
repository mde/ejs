/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var assert = require('assert');
var utils = require('../lib/utils');

/**
 *  Make sure utils exports all it is expected to export...
 */
suite('unit testing for completeness of module \'utils.js\' exports', function () {
  test('expect \'escapeRegExpChars\' to be exported', function () {
    assert.ok(typeof(utils.escapeRegExpChars)==='function');
  });
  test('expect \'escapeXML\' to be exported', function () {
    assert.ok(typeof(utils.escapeXML)==='function');
  });
  test('expect \'escapeXML.toString\' to be exported', function () {
    assert.ok(typeof(utils.escapeXML.toString)==='function');
  });
  test('expect \'shallowCopy\' to be exported', function () {
    assert.ok(typeof(utils.shallowCopy)==='function');
  });
  test('expect \'shallowCopyFromList\' to be exported', function () {
    assert.ok(typeof(utils.shallowCopyFromList)==='function');
  });
  test('expect \'cache\' to be exported', function () {
    assert.ok(typeof(utils.cache)==='object');
  });
  test('expect \'hyphenToCamel\' to be exported', function () {
    assert.ok(typeof(utils.hyphenToCamel)==='function');
  });
});

/**
 *  Make sure all exported properties behave like they should
 */
suite('unit testing exported functions of module \'utils.js\'', function () {
  /**
   *  Unit testing of exported function 'escapeRegExpChars'
   */
  suite('unit testing function \'escapeRegExpChars\' of module \'utils.js\'', function () {
    test('it should be callable without parameters', function () {
      assert.doesNotThrow(() => { utils.escapeRegExpChars(); });
      assert.ok(utils.escapeRegExpChars()==='');
    });
    test('it should be callable with parameter \'string\' {null}', function () {
      assert.doesNotThrow(() => { utils.escapeRegExpChars(null); });
      assert.ok(utils.escapeRegExpChars(null)==='');
    });
    test('it should be callable with parameter \'string\' {string}', function () {
      const str = 'fun()';
      assert.doesNotThrow(() => { utils.escapeRegExpChars(str); });
      assert.ok(utils.escapeRegExpChars(str)==='fun\\(\\)');
    });
  });

  /**
   *  Unit testing of exported function 'escapeXML'
   */
  suite('unit testing function \'escapeXML\' of module \'utils.js\'', function () {
    test('it should be callable without parameters', function () {
      assert.doesNotThrow(() => { utils.escapeXML(); });
      assert.ok(utils.escapeXML()==='');
    });
    test('it should be callable with parameter \'markup\' {null}', function () {
      assert.doesNotThrow(() => { utils.escapeXML(null); });
      assert.ok(utils.escapeXML(null)==='');
    });
    test('it should be callable with parameter \'markup\' {string}', function () {
      const markup  = '<a href="http://fun.org">fun.org</a>';
      const escaped = '&lt;a href=&#34;http://fun.org&#34;&gt;fun.org&lt;/a&gt;';
      assert.doesNotThrow(() => { utils.escapeXML(markup); });
      assert.ok(utils.escapeXML(markup)===escaped);
    });
  });

  /**
   *  Unit testing of exported function 'escapeXML.toString'
   */
  suite('unit testing function \'escapeXML\' of module \'utils.js\'', function () {
    test('it should be callable without parameters', function () {
      const stringified =
`function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
      .replace(_MATCH_HTML, encode_char);
};
var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
`;
      assert.doesNotThrow(() => { utils.escapeXML.toString(); });
      assert.ok(utils.escapeXML.toString()===stringified);
    });
  });

  /**
   *  Unit testing of exported function 'shallowCopy'
   */
  suite('unit testing function \'shallowCopy\' of module \'utils.js\'', function () {
    test('it should be callable without parameters', function () {
      assert.doesNotThrow(() => { utils.shallowCopy(); });
      assert.ok(utils.shallowCopy()===undefined);
    });
    test('should be callable with parameters \'to\' {undefined} and \'from\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopy(undefined, null); });
      assert.ok(utils.shallowCopy(undefined, null)===undefined);
    });
    test('should be callable with parameters \'to\' {null} and \'from\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopy(null, null); });
      assert.ok(utils.shallowCopy(null, null)===null);
    });
    test('should be callable with parameters \'to\' {undefined} and \'from\' {...}', function () {
      const to = undefined;
      const from = { 'foo': 'bar', 'baz': [ '1', '2' ], 'bah': { 'hurz': 'gnarf' }};
      assert.doesNotThrow(() => { utils.shallowCopy(to, from); });
      assert.ok(utils.shallowCopy(to, from)===undefined);
    });
    test('should be callable with parameters \'to\' {undefined} and \'from\' {...}', function () {
      const to = null;
      const from = { 'foo': 'bar', 'baz': [ '1', '2' ], 'bah': { 'hurz': 'gnarf' }};
      assert.doesNotThrow(() => { utils.shallowCopy(to, from); });
      assert.ok(utils.shallowCopy(to, from)===null);
    });
    test('should be callable with parameters \'to\' { } and \'from\' {...}', function () {
      const to = {};
      const from = { 'foo': 'bar', 'baz': [ '1', '2' ], 'bah': { 'hurz': 'gnarf' }};
      assert.doesNotThrow(() => { utils.shallowCopy(to, from); });
      assert.ok(JSON.stringify(utils.shallowCopy(to, from))===JSON.stringify(from));
    });
  });

  /**
   *  Unit testing of exported function 'shallowCopyFromList'
   */
  suite('unit testing function \'shallowCopyFromList\' of module \'utils.js\'', function () {
    test('it should be callable without parameters', function () {
      assert.doesNotThrow(() => { utils.shallowCopyFromList(); });
      assert.ok(utils.shallowCopyFromList()===undefined);
    });
    test('it should be callable parameters \'to\' {undefined} and \'from\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopyFromList(undefined, null); });
      assert.ok(utils.shallowCopyFromList(undefined, null)===undefined);
    });
    test('it should be callable parameters \'to\' {undefined}, \'from\' {null} and \'list\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopyFromList(undefined, null, null); });
      assert.ok(utils.shallowCopyFromList(undefined, null, null)===undefined);
    });
    test('it should be callable parameters \'to\' {undefined}, \'from\' {null} and \'list\' {Array}', function () {
      const list = [ 'foo', 'bar' ];
      assert.doesNotThrow(() => { utils.shallowCopyFromList(undefined, null, list); });
      assert.ok(utils.shallowCopyFromList(undefined, null, list)===undefined);
    });
    test('it should be callable parameters \'to\' {null} and \'from\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopyFromList(null, null); });
      assert.ok(utils.shallowCopyFromList(null, null)===null);
    });
    test('it should be callable parameters \'to\' {undefined}, \'from\' {null} and \'list\' {null}', function () {
      assert.doesNotThrow(() => { utils.shallowCopyFromList(null, null, null); });
      assert.ok(utils.shallowCopyFromList(null, null, null)===null);
    });
    test('it should be callable parameters \'to\' {null}, \'from\' {null} and \'list\' {Array}', function () {
      const list = [ 'foo', 'bar' ];
      assert.doesNotThrow(() => { utils.shallowCopyFromList(null, null, list); });
      assert.ok(utils.shallowCopyFromList(null, null, list)===null);
    });
    test('it should be callable parameters \'to\' { }, \'from\' {...} and \'list\' {Array}', function () {
      const list = [ 'foo', 'bar' ];
      const to = {};
      const from = { 'foo': 'bar', 'baz': [ '1', '2' ], 'bah': { 'hurz': 'gnarf' }};
      assert.doesNotThrow(() => { utils.shallowCopyFromList(to, from, list); });
      assert.ok(JSON.stringify(utils.shallowCopyFromList(to, from, list))===JSON.stringify({ 'foo': 'bar' }));
    });
  });

  /**
   *  Unit testing of exported object 'cache'
   */
  suite('unit testing object \'cache\' of module \'utils.js\'', function () {
    suite('unit testing function \'set\' of object \'cache\'', function () {
      test('it should be callable without parameters', function () {
        assert.doesNotThrow(() => { utils.cache.set(); });
        assert.doesNotThrow(() => { utils.cache.set(undefined, null); });
        assert.doesNotThrow(() => { utils.cache.set(null, undefined); });
        assert.doesNotThrow(() => { utils.cache.set(null, null); });
      });
      test('it should be callable without parameter \'key\' {string}', function () {
        assert.doesNotThrow(() => { utils.cache.set('key', null); });
        assert.doesNotThrow(() => { utils.cache.set('key', undefined); });
        assert.doesNotThrow(() => { utils.cache.set('key', { 'foo': 'bar' }); });
      });
    });
    suite('unit testing function \'get\' of object \'cache\'', function () {
      test('it should be callable without parameters', function () {
        assert.doesNotThrow(() => { utils.cache.get(); });
        // note this depends on setting key {undefined} to {null} - s.a.
        assert.ok(utils.cache.get()===null);
      });
      test('it should be callable parameter \'key\' {undefined}', function () {
        assert.doesNotThrow(() => { utils.cache.get(); });
        // note this depends on setting key {undefined} to {null} - s.a.
        assert.ok(utils.cache.get()===null);
      });
      test('it should be callable parameter \'key\' {null}', function () {
        assert.doesNotThrow(() => { utils.cache.get(null); });
        // note this depends on setting key {null} to {null} - s.a.
        assert.ok(utils.cache.get(null)===null);
      });
      test('it should be callable parameter \'key\' {string}', function () {
        assert.doesNotThrow(() => { utils.cache.get('key'); });
        // note this depends on setting key {string} to {...} - s.a.
        assert.ok(JSON.stringify(utils.cache.get('key'))===JSON.stringify({ 'foo': 'bar' }));
      });
    });
    suite('unit testing function \'remove\' of object \'cache\'', function () {
      test('it should be callable without parameters', function () {
        assert.doesNotThrow(() => { utils.cache.remove(); });
        assert.ok(utils.cache.get()===undefined);
      });
      test('it should be callable with parameter \'key\' {null}', function () {
        assert.doesNotThrow(() => { utils.cache.remove(null); });
        assert.ok(utils.cache.get(null)===undefined);
      });
      test('it should be callable with parameter \'key\' {string}', function () {
        assert.doesNotThrow(() => { utils.cache.remove('key'); });
        assert.ok(utils.cache.get('key')===undefined);
      });
    });
    suite('unit testing function \'reset\' of object \'cache\'', function () {
      test('it should be callable without parameters', function () {
        assert.doesNotThrow(() => { utils.cache.reset(); });
      });
    });
  });

  /**
   *  Unit testing of exported function 'hyphenToCamel'
   */
  suite('unit testing function \'hyphenToCamel\' of module \'utils.js\'', function () {
    test.skip('it should be callable without parameters', function () {
      const message = 'Cannot read property \'replace\' of undefined';
      assert.throws(() => { utils.hyphenToCamel(); }, { name: 'TypeError', message });
    });
    test('it should be callable with parameter \'str\' {string}', function () {
      const str = 'some string';
      const strCamel = str;
      assert.doesNotThrow(() => { utils.hyphenToCamel(str); });
      assert.ok(utils.hyphenToCamel(str)===strCamel);

      const other = 'some-string';
      const otherCamel = 'someString';
      assert.doesNotThrow(() => { utils.hyphenToCamel(other); });
      assert.ok(utils.hyphenToCamel(other)===otherCamel);
    });
  });

});
