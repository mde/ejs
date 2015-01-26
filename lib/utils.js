/*
 * EJS Embedded JavaScript templates
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

'use strict';

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

exports.escapeRegExpChars = function (string) {
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
};

var encodeHTMLRules = {
      '&': '&amp;'
    , '<': '&lt;'
    , '>': '&gt;'
    , '"': '&#34;'
    , "'": '&#39;'
    }
  , matchHTML = /[&<>\'"]/g;

exports.escapeFuncStr =
  'var encodeHTMLRules = {'
+       '"&": "&amp;"'
+     ', "<": "&lt;"'
+     ', ">": "&gt;"'
+     ', \'"\': "&#34;"'
+     ', "\'": "&#39;"'
+     '}'
+   ', matchHTML = /[&<>\'"]/g;';

exports.escapeXML = function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(matchHTML, function(m) {
          return encodeHTMLRules[m] || m;
        });
};

exports.shallowCopy = function (to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

