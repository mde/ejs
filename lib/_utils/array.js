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

var array = new (function () {

  /*
   * humanize(array<Array>)
   *
   * Humanize returns a string of the array items in a
   * readable format
   *
   * Examples:
   *   humanize(["array", "array", "array"])
   *   => "array, array and array"
   *
   *   humanize(["array", "array"])
   *   => "array and array"
   *
   *   humanize(["array"])
   *   => "array"
  */
  this.humanize = function(array) {
    // If array only has one item then just return it
    if(array.length <= 1) {
      return String(array);
    }

    var last = array.pop()
      , items = array.join(', ');

    return items + ' and ' + last;
  };

  /*
   * included(item<Any>, array<Array>)
   *
   * Included checks if an `item` is included in a `array`
   * if it is found then the `array` is returned, otherwise
   * false is returned
   *
   * Examples:
   *   included("array", ["array"])
   *   => ["array"]
   *
   *   included("nope", ["array"])
   *   => false
  */
  this.included = function(item, array) {
    var result = array.indexOf(item);

    if(result === -1) {
      return false;
    } else {
      return array;
    }
  };

})();

exports.array = array;
