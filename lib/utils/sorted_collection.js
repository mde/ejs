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
  // Interface methods
  this.addItem = function (key, val) {
    if (typeof key != 'string') {
      throw('Hash only allows string keys.');
    }
    return this.setByKey(key, val);
  };

  this.getItem = function (p) {
    if (typeof p == 'string') {
      return this.getByKey(p);
    }
    else if (typeof p == 'number') {
      return this.getByIndex(p);
    }
  };

  this.setItem = function (p, val) {
    if (typeof p == 'string') {
      this.setByKey(p, val);
    }
    else if (typeof p == 'number') {
      this.setByIndex(p, val);
    }
  };

  this.removeItem = function (p) {
    if (typeof p == 'string') {
      this.removeByKey(p);
    }
    else if (typeof p == 'number') {
      this.removeByIndex(p);
    }
  };

  this.getByKey = function (key) {
    return this.items[key];
  };

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

  this.getByIndex = function (ind) {
    return this.items[this.order[ind]];
  };

  this.setByIndex = function (ind, val) {
    if (ind < 0 || ind >= this.count) {
      throw('Index out of bounds. Hash length is ' + this.count);
    }
    this.items[this.order[ind]] = val;
  };

  this.removeByIndex = function (pos) {
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      delete this.items[this.order[pos]]
      this.order.splice(pos, 1);
      this.count--;
      return true;
    }
    else {
      return false;
    }
  };

  this.hasKey = function (key) {
    return typeof this.items[key] != 'undefined';
  };

  this.hasValue = function (val) {
    for (var i = 0; i < this.order.length; i++) {
      if (this.items[this.order[i]] == val) {
        return true;
      }
    }
    return false;
  };

  this.allKeys = function (str) {
    return this.order.join(str);
  };

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

  this.insertAtIndex = function (pos, key, val) {
    this.order.splice(pos, 0, key);
    this.items[key] = val;
    this.count++;
    return true;
  };

  this.insertAfterKey = function (refKey, key, val) {
    var pos = this.getPos(refKey);
    this.insertAtPos(pos, key, val);
  };

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

  this.each = function (func, o) {
    var opts = o || {}
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

  this.eachKey = function (func) {
    this.each(func, { keyOnly: true });
  };

  this.eachValue = function (func) {
    this.each(func, { valueOnly: true });
  };

  this.clone = function () {
    var h = new fleegix.hash.Hash();
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      var val = this.items[key];
      h.setItem(key, val);
    }
    return h;
  };

  this.concat = function (hNew) {
    for (var i = 0; i < hNew.order.length; i++) {
      var key = hNew.order[i];
      var val = hNew.items[key];
      this.setItem(key, val);
    }
  };

  this.push = function (key, val) {
    this.insertAtIndex(this.count, key, val);
    return this.count;
  };

  this.pop = function () {
    var pos = this.count-1;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return fleegix.hash.UNDEFINED_VALUE;
    }
  };

  this.unshift = function (key, val) {
    this.insertAtIndex(0, key, val);
    return this.count;
  };

  this.shift = function (key, val) {
    var pos = 0;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeByIndex(pos);
      return ret;
    }
    else {
      return fleegix.hash.UNDEFINED_VALUE;
    }
  };

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
