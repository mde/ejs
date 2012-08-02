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

var SortedCollection = function (d) {
  this.count = 0;
  this.items = {}; // Hash keys and their values
  this.order = []; // Array for sort order
  if (d) {
    this.defaultValue = d;
  };
};

SortedCollection.prototype = new (function () {

  /*
   * addItem(key<String>)
   *
   * addItem adds an item to the list of items returning the value
   * if saved
   *
   * Examples:
   *   addItem("key", "value")
   *   => "value"
  */
  this.addItem = function (key, val) {
    if (typeof key != 'string') {
      throw('Hash only allows string keys.');
    }
    return this.setByKey(key, val);
  };

  /*
   * getItem(identifier<String/Number>)
   *
   * GetItems retrieves an item from the list and returns it's value,
   * the identifier may be a key or an index.
   *
   * Examples:
   *   getItem("key")
   *   => "value"
   *
   *   getItem(5)
   *   => "value"
  */
  this.getItem = function (identifier) {
    if (typeof identifier == 'string') {
      return this.getByKey(identifier);
    }
    else if (typeof identifier == 'number') {
      return this.getByIndex(identifier);
    }
  };

  /*
   * setItem(identifier<String/Number>, val<Any>)
   *
   * SetItem adds a new item to the list from the `identifier` which
   * can be a key or index
   *
   * Examples:
   *   setItem("key", "value")
   *   => "value"
   *
   *   setItem(5, "value")
   *   => "value"
  */
  this.setItem = function (identifier, val) {
    if (typeof identifier == 'string') {
      this.setByKey(identifier, val);
    }
    else if (typeof identifier == 'number') {
      this.setByIndex(identifier, val);
    }
  };

  /*
   * removeItem(identifier<String/Number>)
   *
   * RemoveItem removes items from the list of items
   *
   * Examples:
   *   removeItem("key")
   *   => undefined
   *
   *   removeItem(5)
   *   => undefined
  */
  this.removeItem = function (identifier) {
    if (typeof identifier == 'string') {
      this.removeByKey(identifier);
    }
    else if (typeof identifier == 'number') {
      this.removeByIndex(identifier);
    }
  };

  /*
   * getByKey(key<String>)
   *
   * GetByKey returns the value for the given `key`
   *
   * Examples:
   *   getByKey("key")
   *   => "value"
  */
  this.getByKey = function (key) {
    return this.items[key];
  };

  /*
   * setByKey(key<String>, val<Any>)
   *
   * SetByKey adds a new item from a `key` and `value` and returns
   * the `value`
   *
   * Examples:
   *   setByKey("key", "value")
   *   => "value"
  */
  this.setByKey = function (key, val) {
    var v = null;
    if (typeof val == 'undefined') {
      v = this.defaultValue;
    }
    else { v = val; }
    if (typeof this.items[key] == 'undefined') {
      this.order[this.count] = key;
      this.count++;
    }
    this.items[key] = v;
    return this.items[key];
  };

  /*
   * removeByKey(key<String>)
   *
   * RemoveByKey removes the item at `key`
   *
   * Examples:
   *   removeByKey("key")
   *   => undefined
  */
  this.removeByKey = function (key) {
    if (typeof this.items[key] != 'undefined') {
      var pos = null;
      delete this.items[key]; // Remove the value
      // Find the key in the order list
      for (var i = 0; i < this.order.length; i++) {
        if (this.order[i] == key) {
          pos = i;
        }
      }
      this.order.splice(pos, 1); // Remove the key
      this.count--; // Decrement the length
    }
  };

  /*
   * getByIndex(ind<Number>)
   *
   * GetByIndex returns the value for the given index
   *
   * Examples:
   *   getByIndex(5)
   *   => "value"
  */
  this.getByIndex = function (ind) {
    return this.items[this.order[ind]];
  };

  /*
   * setByIndex(ind<Number>, val<Any>)
   *
   * SetByIndex creates or updates a item at the given index and `value`
   *
   * Examples:
   *   setByIndex(5, "value")
   *   => undefined
  */
  this.setByIndex = function (ind, val) {
    if (ind < 0 || ind >= this.count) {
      throw('Index out of bounds. Hash length is ' + this.count);
    }
    this.items[this.order[ind]] = val;
  };


  /*
   * removeByIndex(ind<number>)
   *
   * RemoveByIndex removes the item at the given index
   *
   * Examples:
   *   removeByIndex(5)
   *   => true
  */
  this.removeByIndex = function (ind) {
    var ret = this.items[this.order[ind]];
    if (typeof ret != 'undefined') {
      delete this.items[this.order[ind]]
      this.order.splice(ind, 1);
      this.count--;
      return true;
    }
    else {
      return false;
    }
  };

  /*
   * hasKey(key<String>)
   *
   * HasKey returns undefined if the key doesn't exist
  */
  this.hasKey = function (key) {
    return typeof this.items[key] !== 'undefined';
  };

  /*
   * hasValue(val<Any>)
   *
   * HasValue returns true if the `val` exists in the list false if not
  */
  this.hasValue = function (val) {
    var i = this.order.length;

    while(--i >= 0) {
      if (this.items[this.order[i]] == val) {
        return true;
      }
    }
    return false;
  };

  /*
   * allKeys(str<String>)
   *
   * Returns all the items in a string format seperated by `str`
  */
  this.allKeys = function (str) {
    return this.order.join(str);
  };

  /*
   * replaceKey(oldKey<String>, newKey<String>)
   *
   * ReplaceKey replaces the `oldKey` with the `newKey`
  */
  this.replaceKey = function (oldKey, newKey) {
    // If item for newKey exists, nuke it
    if (this.hasKey(newKey)) {
      this.removeItem(newKey);
    }
    this.items[newKey] = this.items[oldKey];
    delete this.items[oldKey];
    for (var i = 0; i < this.order.length; i++) {
      if (this.order[i] == oldKey) {
        this.order[i] = newKey;
      }
    }
  };

  /*
   * insertAtIndex(pos<Number>, key<String>, val<Any>)
   *
   * Same as setByIndex except allows you to replace the `key` and `val`
  */
  this.insertAtIndex = function (pos, key, val) {
    this.order.splice(pos, 0, key);
    this.items[key] = val;
    this.count++;
    return true;
  };

  /*
   * insertAfterKey(refKey<String>, key<String>, val<Any>)
   *
   * Same as setByKey except allows you to replace `key` and `val`
  */
  this.insertAfterKey = function (refKey, key, val) {
    var pos = this.getPos(refKey);
    this.insertAtPos(pos, key, val);
  };

  /*
   * getPosition(key<String>)
   *
   * GetPosition returns the index where `key` is at
   *
   * Examples:
   *   getPosition("key")
   *   => 5
  */
  this.getPosition = function (key) {
    var order = this.order;
    if (typeof order.indexOf == 'function') {
      return order.indexOf(key);
    }
    else {
      for (var i = 0; i < order.length; i++) {
        if (order[i] == key) { return i;}
      }
    }
  };

  /*
   * each(options<Object>, func<Function>)
   *
   * Each iterates over each item and calls the `func` on it
   *
   * Notes:
   *   The old version was `func` first then `options` but
   *   it's been reversed for better readability. We're keeping
   *   backwards compatibility though.
  */
  this.each = function (options, func) {
    // Compat
    if(typeof options === 'function') {
      var temp = options;
      options = func;
      func = temp;
    }

    var opts = options || {}
      , order = this.order;
    for (var i = 0, ii = order.length; i < ii; i++) {
      var key = order[i];
      var val = this.items[key];
      if (opts.keyOnly) {
        func(key);
      }
      else if (opts.valueOnly) {
        func(val);
      }
      else {
        func(val, key);
      }
    }
    return true;
  };

  /*
   * eachKey(func<Function>)
   *
   * Calls each and only calls `func` with the keys
  */
  this.eachKey = function (func) {
    this.each({ keyOnly: true }, func);
  };

  /*
   * eachKey(func<Function>)
   *
   * Calls each and only calls `func` with the values
  */
  this.eachValue = function (func) {
    this.each({ valueOnly: true }, func);
  };

  /*
   * clone()
   *
   * Clone returns a copy of the current collection
  */
  this.clone = function () {
    var coll = new SortedCollection()
      , key
      , val;
    for (var i = 0; i < this.order.length; i++) {
      key = this.order[i];
      val = this.items[key];
      coll.setItem(key, val);
    }
    return coll;
  };

  this.concat = function (hNew) {
    for (var i = 0; i < hNew.order.length; i++) {
      var key = hNew.order[i];
      var val = hNew.items[key];
      this.setItem(key, val);
    }
  };

  /*
   * push(key<String>, val<Any>)
   *
   * Push adds a new item to the end of the list
  */
  this.push = function (key, val) {
    this.insertAtIndex(this.count, key, val);
    return this.count;
  };

  /*
   * pop()
   *
   * Pop returns that last item
  */
  this.pop = function () {
    var pos = this.count-1;
    var ret = this.items[this.order[pos]];
    if (typeof ret !== 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return;
    }
  };

  /*
   * unshift(key<String>, val<Any>)
   *
   * Unshift inserts the key/value item at the beginning and returns the count
  */
  this.unshift = function (key, val) {
    this.insertAtIndex(0, key, val);
    return this.count;
  };

  /*
   * shift()
   *
   * Shift removes the first item and returns the list
  */
  this.shift = function () {
    var pos = 0;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return;
    }
  };

  /*
   * splice(index<Number>, numToRemove<Number>, hash<Object>)
   *
   * Splice removes `numToRemove` items starting from `index` and adds
   * items in `hash` starting at `index`
  */
  this.splice = function (index, numToRemove, hash) {
    var _this = this;
    // Removal
    if (numToRemove > 0) {
      // Items
      var limit = index + numToRemove;
      for (var i = index; i < limit; i++) {
        delete this.items[this.order[i]];
      }
      // Order
      this.order.splice(index, numToRemove);
    }
    // Adding
    if (hash) {
      // Items
      for (var i in hash.items) {
        this.items[i] = hash.items[i];
      }
      // Order
      var args = hash.order;
      args.unshift(0);
      args.unshift(index);
      this.order.splice.apply(this.order, args);
    }
    this.count = this.order.length;
  };

  this.sort = function (c) {
    var arr = [];
    // Assumes vals are comparable scalars
    var comp = function (a, b) {
      return c(a.val, b.val);
    }
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      arr[i] = { key: key, val: this.items[key] };
    }
    arr.sort(comp);
    this.order = [];
    for (var i = 0; i < arr.length; i++) {
      this.order.push(arr[i].key);
    }
  };

  this.sortByKey = function (comp) {
    this.order.sort(comp);
  };

  this.reverse = function () {
    this.order.reverse();
  };

})();

module.exports.SortedCollection = SortedCollection;
