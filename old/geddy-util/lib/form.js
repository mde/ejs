/*
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

if (typeof geddy == 'undefined') { geddy = {}; } 
if (typeof geddy.util == 'undefined') { geddy.util = {}; }

geddy.util.form = new function () {
  /**
   * Serializes the data from all the inputs in a Web form
   * into a query-string style string.
   * @param f -- Reference to a DOM node of the form element
   * @param opts -- JS object of options for how to format
   * the return string. See fleegix.url.objectToQS for usage.
   * @returns query-string style String of variable-value pairs
   */
  this.serialize = function (f, opts) {
    var h = this.toObject(f, opts);
    if (typeof fleegix.url == 'undefined') {
      throw new Error('fleegix.form.serialize depends on the fleegix.url module.');
    }
    var str = fleegix.url.objectToQS(h, opts);
    return str;
  };

  /**
   * Converts the values in an HTML form into a JS object
   * Elements with multiple values like sets of radio buttons
   * become arrays
   * @param f -- HTML form element to convert into a JS object
   * @param o -- JS Object of options:
   *    pedantic: (Boolean) include the values of elements like
   *      button or image
   *    hierarchical: (Boolean) if the form is using Rails-/PHP-style
   *      name="foo[bar]" inputs, setting this option to
   *      true will create a hierarchy of objects in the
   *      resulting JS object, where some of the properties
   *      of the objects are sub-objects with values pulled
   *      from the form. Note: this only supports one level
   *      of nestedness
   * hierarchical option code by Kevin Faulhaber, kjf@kjfx.net
   * @returns JavaScript object representation of the contents
   * of the form.
   */
  this.toObject= function (f, o) {
    var opts = o || {};
    var h = {};
    function expandToArr(orig, val) {
      if (orig) {
        var r = null;
        if (typeof orig == 'string') {
          r = [];
          r.push(orig);
        }
        else { r = orig; }
        r.push(val);
        return r;
      }
      else { return val; }
    }

    for (var i = 0; i < f.elements.length; i++) {
      var elem = f.elements[i];
      // Elements should have a name
      if (elem.name) {
        var st = elem.name.indexOf('[');
        var sp = elem.name.indexOf(']');
        var sb = '';
        var en = '';
        var c;
        var n;
        // Using Rails-/PHP-style name="foo[bar]"
        // means you can go hierarchical if you want
        if (opts.hierarchical && (st > 0) && (sp > 2)) {
            sb = elem.name.substring(0, st);
            en = elem.name.substring(st + 1, sp);
            if (typeof h[sb] == 'undefined') { h[sb] = {}; }
            c = h[sb];
            n = en;
        }
        else {
            c = h;
            n = elem.name;
        }
        switch (elem.type) {
          // Text fields, hidden form elements, etc.
          case 'text':
          case 'hidden':
          case 'password':
          case 'textarea':
          case 'select-one':
            c[n] = elem.value;
            break;
          // Multi-option select
          case 'select-multiple':
            for(var j = 0; j < elem.options.length; j++) {
              var e = elem.options[j];
              if(e.selected) {
                c[n] = expandToArr(c[n], e.value);
              }
            }
            break;
          // Radio buttons
          case 'radio':
            if (elem.checked) {
              c[n] = elem.value;
            }
            break;
          // Checkboxes
          case 'checkbox':
            if (elem.checked) {
              c[n] = expandToArr(c[n], elem.value);
            }
            break;
          // Pedantic
          case 'submit':
          case 'reset':
          case 'file':
          case 'image':
          case 'button':
            if (opts.pedantic) { c[n] = elem.value; }
            break;
        }
      }
    }
    return h;
  };

}();

if (typeof module != 'undefined') { module.exports = geddy.util.form; }

