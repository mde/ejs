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
var utils = require('../utils')

exports.linkTo = {
  name: 'linkTo',
  action: function() {}
};

exports.scriptLink = {
  name: 'scriptLink',
  action: function() {}
};

exports.styleLink = {
  name: 'styleLink',
  action: function() {}
};

/*
 * truncate(string<String>, options<Object>, callback[Function])
 *
 * Truncates a given `string` after a specified `length` if `string` is longer than
 * `length`. The last characters will be replaced with an `omission` for a total length not
 * exceeding `length`. If `callback` is given it will fire if `string` is truncated.
 *
 * Options:
 *   length    <Integer>          Length the output string will be(default: 30)
 *   len       <Integer>          Alias for length
 *   omission  <String>           Replace last letters with an omission(default: '...')
 *   ellipsis  <String>           Alias for omission
 *   seperator <String>/<RegExp>  Break the truncated text at the nearest `seperator`
 *
 * Warnings:
 *   Please be aware that truncating HTML tags or entities may result in malformed HTML returned
 *
 * Examples:
 *   truncate('Once upon a time in a world', { length: 10 })
 *   => 'Once up...''
 *
 *  truncate('Once upon a time in a world', { length: 20, omission: '...(continued)' })
 *   => 'Once u...(continued)'
 *
 *  truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
 *   => 'Once upon a...'
 *   Normal Output: => 'Once upon a ...'
 *
 *  truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
 *   => 'Once upon a...'
 *   Normal Output: => 'Once upon a ...'
 *
 *  truncate('<p>Once upon a time</p>', { length: 20 })
 *   => '<p>Once upon a ti...'
 */
exports.truncate = {
  name: 'truncate',
  action: utils.string.truncate
};

/*
 * truncateHTML(string<String>, options<Object>, callback[Function])
 *
 * Truncates a given `string` inside HTML tags after a specified `length` if `string` is longer than
 * `length`. The last characters will be replaced with an `omission` for a total length not
 * exceeding `length`. If `callback` is given it will fire if `string` is truncated. If `once` is
 * true only the first string in the first HTML tags will be truncated leaving the others as they
 * were
 *
 * Options:
 *   once <Boolean> If true it will only truncate the first text found in the first
 *                  set of HTML tags(default: false)
 *
 * Notes:
 *   * All options available in the `truncate` helper are also available in `truncateHTML`
 *   * HTML tags will not be truncated, so return value will always be safe for rendering
 *
 * Examples:
 *   truncateHTML('<p>Once upon a time in a world</p>', { length: 10 })
 *   => '<p>Once up...</p>'
 *
 *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 })
 *   => '<p>Once up...<small>in a wo...</small></p>'
 *
 *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true })
 *   => '<p>Once up...<small>in a world</small></p>'
 */
exports.truncateHTML = {
  name: 'truncateHTML',
  //altName: 'truncate_HTML',
  action: utils.string.truncateHTML
};
