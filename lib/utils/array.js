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

  this.humanize = function(array) {
    // Return an array in a readable form, useful for outputting lists of items

    var last = array.pop();
    array = array.join(', ');
    return array + ' and ' + last;
  };

  this.included = function(item, array) {
    // Check if an `item` is included in an `array`
    // If the `item` is found, it'll return and object with the key and value,
    // - otherwise return undefined

    if(!item) return undefined;
    var result = array.indexOf(item);

    if(result === -1) {
      return undefined;
    } else return { key: result, value: array[result] };
  };

})();

exports.array = array;
