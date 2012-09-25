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
var parseopts = {};

/**
 * @constructor
 * Parses a list of command-line args into a key/value object of
 * options and an array of positional commands.
 *
 * @param {Array} opts A list of options
 *
 * Examples:
 *   [{full: 'foo', abbr: 'f'}, {full: 'bar', abbr: ['b', 'x']}]
 */
parseopts.Parser = function (opts) {
  var self = this
    , i, key, value;

  this.cmds = []; // Positional commands parsed from args
  this.opts = {}; // A key/value object of matching options parsed from args

  // Data structures used for parsing
  this.reg = [];
  this.shortOpts = {};
  this.longOpts = {};

  for (i in opts) {
    key = i;
    value = opts[key];

    // Defaults and alias's
    value.abbr = value.abbreviation || value.abbr;
    if (typeof value.args === 'undefined') {
      value.args = true;
    }

    // If the abbreviation is a Array then all of those inside are
    // added to shortOpts
    if (value.abbr instanceof Array) {
      value.abbr.forEach(function (item, index) {
        self.shortOpts[item] = {full: value.full};
        self.shortOpts[item]['args'] = value.args;
      });
    } else {
      this.shortOpts[value.abbr] = {full: value.full};
      this.shortOpts[value.abbr]['args'] = value.args;
    }

    this.longOpts[value.full] = {full: value.full};
    this.longOpts[value.full]['args'] = value.args;
  }
  this.reg = opts;
};

parseopts.Parser.prototype = new function () {

  /**
   * Parses an array of arguments into options and positional commands
   * Any matcthing opts end up in a key/value object keyed by the 'full'
   * name of the option. Any args that aren't passed as options end up in
   * an array of positional commands.
   * Any options passed without a value end up with a value of null
   * in the key/value object of options
   * If the user passes options that are not defined in the list passed
   * to the constructor, the parser throws an error 'Unknown option.'
   * @param {Array} args The command-line args to parse
   */
  this.parse = function (args) {
    var cmds = []
      , opts = {}
      , arg
      , argObj
      , fullArgName
      , argItems;

    while (args.length) {
      arg = args.shift();

      // Full option name
      if (arg.indexOf('--') === 0) {
        argItems = arg.split('=');
        argObj = this.longOpts[argItems[0].substr(2)];

        // If argument exists
        if (argObj) {
          fullArgName = argObj.full; // Get full name

          // If the option doesn't rake arguments then set value to true
          if(!argObj.args) {
            opts[fullArgName] = true;
          } else opts[fullArgName] = argItems[1] || true;
        } else throw new Error('Unknown option "' + arg + '"');
      }
      // Short option name
      else if (arg.indexOf('-') === 0) {
        // Get arg from list of options
        argObj = this.shortOpts[arg.substr(1)];

        // If argument exists
        if (argObj) {
          fullArgName = argObj.full; // Get full name

          // If the option doesn't rake arguments then set value to true
          if(!argObj.args) {
            opts[fullArgName] = true;
          } else {
            // If no argument is given for this option then set it's value to true
            if(!args[0] || (args[0].indexOf('-') == 0) || (args[0].indexOf('--') == 0)) {
              opts[fullArgName] = true;
            } else opts[fullArgName] = args.shift();
          }
        } else throw new Error('Unknown option "' + arg + '"');
      }
      // Assume command name
      else cmds.push(arg);
    }

    this.cmds = cmds;
    this.opts = opts;
  };

};

module.exports = parseopts;
