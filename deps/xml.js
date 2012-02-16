/*  This work is licensed under Creative Commons GNU LGPL License.

  License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.9
  Author:  Stefan Goessner/2006
  Web:     http://goessner.net/ 
*/
function json2xml(o, tab) {
   var toXml = function(v, name, ind) {
      var xml = "";
      if (v instanceof Array) {
         for (var i=0, n=v.length; i<n; i++)
            xml += ind + toXml(v[i], name, ind+"\t") + "\n";
      }
      else if (typeof(v) == "object") {
         console.log('object');
         var hasChild = false;
         xml += ind + "<" + name;
         for (var m in v) {
            if (m.charAt(0) == "@")
               xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
            else
               hasChild = true;
         }
         xml += hasChild ? ">" : "/>";
         if (hasChild) {
            for (var m in v) {
               if (m == "#text")
                  xml += v[m];
               else if (m == "#cdata")
                  xml += "<![CDATA[" + v[m] + "]]>";
               else if (m.charAt(0) != "@")
                  xml += toXml(v[m], m, ind+"\t");
            }
            xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">";
         }
      }
      else {
         xml += ind + "<" + name + ">" + v.toString() +  "</" + name + ">";
      }
      return xml;
   }, xml="";
   for (var m in o)
      xml += toXml(o[m], m, "");
   return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
}

exports.XML_ = new (function XML() {
  this.stringify = function(o) {
    return json2xml(o);
  };
})();

exports.XML = new (function () {
  var INDENT_LEVEL = 4;

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
          , currentIndent = (new Array(level * INDENT_LEVEL)).join(' ')
          , nextIndent = (new Array((level + 1) * INDENT_LEVEL)).join(' ')
          , xml = '';
        switch (typeof o) {
          case 'string':
          case 'number':
          case 'boolean':
            xml = o;
            break;
          case 'object':
            if (o instanceof Array) {
              pack = [];
              for (var i = 0, ii = o.length; i < ii; i++) {
                item = o[i];
                if (!name) {
                  n = tagFromType(item, n);
                }
                pack.push(obj2xml(item, '', level + 1));
              }
              if (name) {
                n = name;
              }
              if (level == 0) {
                xml += currentIndent + '<' + n + 's type="array">\n'
              }
              xml += nextIndent + '<' + n + '>' +
                  pack.join('</' + n + '>\n' + nextIndent +
                      '<' + n + '>') + '</' + n + '>\n';
              if (level == 0) {
                xml += currentIndent + '</' + n + 's>';
              }
            }
            else {
              n = name || 'object';
              if (level == 0) {
                xml = currentIndent + '<' + n + '>\n';
              }
              for (var p in o) {
                item = o[p];

                xml += nextIndent;

                if (p == '#cdata') {
                  xml += '<![CDATA[' + item + ']]>\n';
                }
                else {
                  xml += '<' + p;
                  if (item instanceof Array) {
                    xml += ' type="array">\n'
                  }
                  else if (typeof item == 'object') {
                    xml += '>\n';
                  }
                  else {
                    xml += '>'
                  }
                  xml += obj2xml(item, p, level + 1);
                  if (item instanceof Array || typeof item == 'object') {
                    xml += nextIndent;
                  }
                  xml += '</' + p + '>\n';
                }
              }
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

  this.stringify = function (o) {
    var xml = '';
    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += obj2xml(o, '', 0);
    return xml;
  };

})();
