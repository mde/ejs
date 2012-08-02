/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
var inflection = require('../../deps/inflection');

exports.XML = new (function () {

  // Default indention level
  var indentLevel = 4
    , tagFromType
    , obj2xml;

  tagFromType = function(item, prev) {
    var ret
      , type
      , types;

    if (item instanceof Array) {
      ret = 'array';
    } else {
      types = ['string', 'number', 'boolean', 'object'];
      for (var i = 0, ii = types.length; i < ii; i++) {
        type = types[i];
        if (typeof item == type) {
          ret = type;
        }
      }
    }

    if (prev && ret != prev) {
      return 'record'
    } else {
      return ret;
    }
  };

  obj2xml = function(o, opts) {
    var name = opts.name
      , level = opts.level
      , arrayRoot = opts.arrayRoot
      , pack
      , item
      , n
      , currentIndent = (new Array(level * indentLevel)).join(' ')
      , nextIndent = (new Array((level + 1) * indentLevel)).join(' ')
      , xml = '';

    switch (typeof o) {
      case 'string':
      case 'number':
      case 'boolean':
        xml = o.toString();
        break;
      case 'object':
        // Arrays
        if (o instanceof Array) {

          // Pack the processed version of each item into an array that
          // can be turned into a tag-list with a `join` method below
          // As the list gets iterated, if all items are the same type,
          // that's the tag-name for the individual tags. If the items are
          // a mixed, the tag-name is 'record'
          pack = [];
          for (var i = 0, ii = o.length; i < ii; i++) {
            item = o[i];
            if (!name) {
              // Pass any previous tag-name, so it's possible to know if
              // all items are the same type, or it's mixed types
              n = tagFromType(item, n);
            }
            pack.push(obj2xml(item, {
              name: name
            , level: level + 1
            , arrayRoot: arrayRoot
            }));
          }

          // If this thing is attached to a named property on an object,
          // use the name for the containing tag-name
          if (name) {
            n = name;
          }

          // If this is a top-level item, wrap in a top-level containing tag
          if (level == 0) {
            xml += currentIndent + '<' + inflection.pluralize(n) + ' type="array">\n'
          }
          xml += nextIndent + '<' + n + '>' +
              pack.join('</' + n + '>\n' + nextIndent +
                  '<' + n + '>') + '</' + n + '>\n';

          // If this is a top-level item, close the top-level containing tag
          if (level == 0) {
            xml += currentIndent + '</' + inflection.pluralize(n) + '>';
          }
        }
        // Generic objects
        else {
          n = name || 'object';

          // If this is a top-level item, wrap in a top-level containing tag
          if (level == 0) {
            xml += currentIndent + '<' + n;
            // Lookahead hack to allow tags to have attributes
            for (var p in o) {
              if (p.indexOf('attr:') == 0) {
                xml += ' ' + p.replace(/^attr:/, '') + '="' +
                    o[p] + '"'
              }
            }
            xml += '>\n';
          }
          for (var p in o) {
            item = o[p];

            // Data properties only
            if (typeof item == 'function') {
              continue;
            }
            // No attr hack properties
            if (p.indexOf('attr:') == 0) {
              continue;
            }

            xml += nextIndent;

            if (p == '#cdata') {
              xml += '<![CDATA[' + item + ']]>\n';
            }
            else {

              // Complex values, going to have items with multiple tags
              // inside
              if (typeof item == 'object') {
                if (item instanceof Array) {
                  if (arrayRoot) {
                    xml += '<' + p + ' type="array">\n'
                  }
                }
                else {
                  xml += '<' + p;
                  // Lookahead hack to allow tags to have attributes
                  for (var q in item) {
                    if (q.indexOf('attr:') == 0) {
                      xml += ' ' + q.replace(/^attr:/, '') + '="' +
                          item[q] + '"'
                    }
                  }
                  xml += '>\n';
                }
              }
              // Scalars, just a value and closing tag
              else {
                xml += '<' + p + '>'
              }
              xml += obj2xml(item, {
                name: p
              , level: level + 1
              , arrayRoot: arrayRoot
              });

              // Objects and Arrays, need indentation before closing tag
              if (typeof item == 'object') {
                if (item instanceof Array) {
                  if (arrayRoot) {
                    xml += nextIndent;
                    xml += '</' + p + '>\n';
                  }
                }
                else {
                  xml += nextIndent;
                  xml += '</' + p + '>\n';
                }
              }
              // Scalars, just close
              else {
                xml += '</' + p + '>\n';
              }
            }
          }
          // If this is a top-level item, close the top-level containing tag
          if (level == 0) {
            xml += currentIndent + '</' + n + '>\n';
          }
        }
        break;
      default:
        // No default
    }
    return xml;
  }

  /*
   * XML configuration
   *
  */
  this.config = {
      whitespace: true
    , name: null
    , fragment: false
    , level: 0
    , arrayRoot: true
  };

  /*
   * setIndentLevel(level<Number>)
   *
   * SetIndentLevel changes the indent level for XML.stringify and returns it
   *
   * Example:
   *   setIndentLevel(5)
   *   => 5
  */
  this.setIndentLevel = function (level) {
    if(!level) {
      return;
    }

    return indentLevel = level;
  };

  /*
   * stringify(obj<Any>, opts<Object>)
   *
   * Stringify returns an XML representation of the given `obj`
   *
   * Options:
   *   whitespace <Boolean> Don't insert indents and newlines after xml entities(Default: true)
   *   name <String>        Use custom name as global namespace(Default: type of object)
   *   fragment <Boolean>   If true no header fragment is added to the top(Default: false)
   *   level    <Number>    Remove this many levels from the output(Default: 0)
   *   arrayRoot <Boolean>  (Default: true)
  */
  this.stringify = function (obj, opts) {
    var config = geddy.mixin({}, this.config)
      , xml = '';
    geddy.mixin(config, (opts || {}));

    if (!config.whitespace) {
      indentLevel = 0;
    }

    if (!config.fragment) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += obj2xml(obj, {
      name: config.name
    , level: config.level
    , arrayRoot: config.arrayRoot
    });

    if (!config.whitespace) {
      xml = xml.replace(/>\n/g, '>');
    }

    return xml;
  };

})();
