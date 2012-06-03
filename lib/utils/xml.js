
exports.XML = new (function () {
  var whitespace = true
    , indentLevel = 4;

  var tagFromType = function (item, prev) {
        var ret
          , type
          , types;
        if (item instanceof Array) {
          ret = 'array';
        }
        else {
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
        }
        else {
          return ret;
        }
      }

    , obj2xml = function (o, name, level) {
        var pack
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
                pack.push(obj2xml(item, '', level + 1));
              }

              // If this thing is attached to a named property on an object,
              // use the name for the containing tag-name
              if (name) {
                n = name;
              }

              // If this is a top-level item, wrap in a top-level containing tag
              if (level == 0) {
                xml += currentIndent + '<' + geddy.inflection.pluralize(n) + ' type="array">\n'
              }
              xml += nextIndent + '<' + n + '>' +
                  pack.join('</' + n + '>\n' + nextIndent +
                      '<' + n + '>') + '</' + n + '>\n';

              // If this is a top-level item, close the top-level containing tag
              if (level == 0) {
                xml += currentIndent + '</' + geddy.inflection.pluralize(n) + '>';
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
                  xml += '<' + p;
                  // Complex values, going to have items with multiple tags
                  // inside
                  if (typeof item == 'object') {
                    if (item instanceof Array) {
                      xml += ' type="array">\n'
                    }
                    else {

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
                    xml += '>'
                  }
                  xml += obj2xml(item, p, level + 1);

                  // Objects and Arrays, need indentation before closing tag
                  if (typeof item == 'object') {
                    xml += nextIndent;
                  }
                  xml += '</' + p + '>\n';
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
      };

  this.config = {
    whitespace: true
  , name: null
  , fragment: false
  , level: 0
  };

  this.setIndentLevel = function (level) {
    indentLevel = level;
  };

  this.stringify = function (o, opts) {
    var config = geddy.mixin({}, this.config)
      , xml = '';
    geddy.mixin(config, (opts || {}));

    if (!config.whitespace) {
      indentLevel = 0;
    }

    if (!config.fragment) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += obj2xml(o, (config.name || ''), config.level);

    if (!config.whitespace) {
      xml = xml.replace(/>\n/g, '>');
    }

    return xml;
  };

})();
