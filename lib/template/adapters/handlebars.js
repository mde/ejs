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

var file = require('utilities').file
  , Handlebars;


Handlebars = function () {
  this.engine = this.engine || file.requireLocal('handlebars');
};

Handlebars.prototype.compile = function (template, options) {
  return this.engine.compile(template, options);
};

Handlebars.prototype.render = function (data, fn) {
  return fn(data);
};

/*
 * We have to have these helper functions because
 * Handlebars requires them to create helpers
 *
 * Usually we can just send in functions as data to render and compile
 * and those are helpers but not here, it just ignores functions.
 *
 * Also it's really strict about only allowing functions to be registered
 * as helpers so we have to type check everything to ensure it's the correct
 * way..
*/

Handlebars.prototype.registerHelper = function (name, helper) {
  if (!name || !helper || {}.toString.call(helper) !== '[object Function]') {
    return false;
  }

  this.engine.registerHelper(name, this.wrapOptions(helper));
};

Handlebars.prototype.registerHelpers = function (helpers) {
  if (!helpers) {
    return false;
  }

  for (var h in helpers) {
    this.registerHelper(h, helpers[h]);
  }
};

/*
 * In erj we can simple call function passing options hash
 * as argument in template, but for for handlebars it's impossible,
 * cause object hash is not mustache expression
 *
 * We can use optional has arguments in handlerbars for this,
 * but will be passed inside wrapped option object {hash : { foo : 'bar', baz : 'bla' }}
 * and template helpers in /template/helpers like urlFor
 * is not intended to work with this. So we just unpack options and pass them
 * to regular helper function and we can keep one set helpers with optional arguments
 * for handlebars and other engines
 */

Handlebars.prototype.wrapOptions = function (helper) {
  return function () {
    var argsLen = arguments.length
      , options = argsLen ? arguments[argsLen - 1] : null
      , i, newArgs;

    if (options && options.hash) {
      newArgs = [];

      for (i = 0; i<argsLen - 1; i++) {
        newArgs.push(arguments[i]);
      }

      newArgs.push(options.hash);
      return helper.apply(this, newArgs);
    } else {
      return helper.apply(this, arguments);
    }
  }
}

module.exports = Handlebars;
