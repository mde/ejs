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

// need this, but maybe there's a better spot for it?
var regExpEscape = (function () {
  var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
  sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  return function (text) { return text.replace(sRE, '\\$1'); };
})();

/*
 * Simple router for Node -- setting up routes looks like this:
 *
 * r = new Router();
 * r.match('/').to({ controller: 'Main', action: 'index' }).name('main');
 * r.match('/users/:userid/messages/:messageid').to({controller: 'Users', action: 'index'});
 *
 * Pretty familiar to anyone who's used Merb/Rails
 */

/*
 * Router - it routes.
 */
var Router = function () {
  this.routes = [];

  /*
   * Router.match()
   *
   * r.match('/:controller/:action(/:id)(.:format)', 'GET',{ id:/\d+/ }).to(......)
   *
   * path is mandatory (duh)
   * method is optional, routes without a method will apply in all cases
   * the options hash (which is also optional) compares either a regex or a
   * string to the key's value in the path
   *
   * returns: Route (for chaining)
   */
  this.match = function () {
    var path
      , method
      , opts = {}
      , args
      , arg;
    args = Array.prototype.slice.call(arguments);

    path = args.shift();

    // Pull the optional method and opts off the args
    while ((arg = args.shift())) {
      if (typeof arg == 'string') {
        method = arg;
      }
      else {
        opts = arg;
      }
    }

    route = new Route(path, method, opts);
    this.routes.push(route);

    // TODO: set route options & regex
    return route;
  };

  /*
   * Router.resource()
   *
   * r.resource('Products')
   *
   * generates standard resource routes for a controller name
   *
   * returns: array of Routes (for now)
   */
  this.resource = function (res) {
    var controller = geddy.string.camelize(res, {initialCap: true});
    var cslug = geddy.string.decamelize(res);
    // FIXME: Need a better way to generate GET/HEAD pairs
    return [
      this.match('/'+cslug+'(.:format)', 'GET')
          .to({ controller: controller, action: 'index' }),
      this.match('/'+cslug+'(.:format)', 'HEAD')
          .to({ controller: controller, action: 'index' }),
      this.match('/'+cslug+'/add(.:format)', 'GET')
          .to({ controller: controller, action: 'add' }),
      this.match('/'+cslug+'/add(.:format)', 'HEAD')
          .to({ controller: controller, action: 'add' }),
      this.match('/'+cslug+'/:id(.:format)', 'GET')
          .to({ controller: controller, action: 'show' }),
      this.match('/'+cslug+'/:id(.:format)', 'HEAD')
          .to({ controller: controller, action: 'show' }),
      this.match('/'+cslug+'/:id/edit(.:format)', 'GET')
          .to({ controller: controller, action: 'edit' }),
      this.match('/'+cslug+'/:id/edit(.:format)', 'HEAD')
          .to({ controller: controller, action: 'edit' }),
      this.match('/'+cslug+'(.:format)', 'POST')
          .to({ controller: controller, action: 'create' }),
      this.match('/'+cslug+'/:id(.:format)', 'PUT')
          .to({ controller: controller, action: 'update' }),
      this.match('/'+cslug+'/:id(.:format)', 'DELETE')
          .to({ controller: controller, action: 'remove' })
    ];
  };

  // find the first route that match the path & method
  /*
   * geddy.router.first('/snow_dogs/5', 'GET')
   * => { controller: 'SnowDogs', action: 'show', id: 5, method: 'GET' }
   *
   * find & return a params hash from the first route that matches
   *
   * if there's no match, this will return false
   */
  this.first = function (url, method) {
    var routes = this.routes
      , route
      , ret = false
      , path = url
      , notAllowed = false
      , allowed = []
      , err;
    for (var i = 0, ii = routes.length; i < ii; i++) {
      route = routes[i];
      // attempt the parse
      ret = route.parse(path, method);
      if (ret) {
        if (ret instanceof Error) {
          notAllowed = true;
          allowed.push(ret.allowed);
        }
        else {
          return ret;
        }
      }
    }
    if (notAllowed) {
      err = new Error('Method Not Allowed');
      err.allowed = allowed;
      return err;
    }
    else {
      return false;
    }
  };

  /*
   * geddy.router.all('/snow_dogs/bob', 'GET') =>
   *  [
   *    { controller: 'SnowDogs', action: 'show', id: 'bob', method: 'GET' },
   *    { controller: 'SnowDogs', action: 'bob', method: 'GET' }
   *  ]
   *
   * find & return a params hash from ALL routes that match
   *
   * if there's no matches, returns an empty array
   */
  this.all = function (path, method) {
    var ret = [];
    var route = false;
    for (var i in this.routes) {
      // if the method doesn't match: jog on
      if (typeof(this.routes[i].method) != 'undefined' && this.routes[i].method != method) {
        continue;
      }
      // attempt the parse
      route = this.routes[i].parse(path, method);
      if (route) {
        ret.push(route);
      }
    }
    return ret;
  };

  /*
   * geddy.router.url({ controller: 'SnowDogs', action: 'show', id: 5 }) => '/snow_dogs/5'
   *
   * geddy.router.url({ controller: 'SnowDogs', action: 'show', id: 5, format: 'json' })
   *    => '/snow_dogs/5.json'
   *
   * generates a URL from a params hash
   *
   * returns false if there are no suitable routes
   */
  this.url = function (params) {
    var url = false;

    // attempt the stringification with defaults mixed in
    params = geddy.mixin({controller:'Application', action:'index' }, params);

    // iterate through the existing routes until a suitable match is found
    for (var i in this.routes) {
      // do the controller & acton match?
      if (typeof(this.routes[i].params.controller) != 'undefined' &&
          this.routes[i].params.controller != params.controller) {
        continue;
      }
      if (typeof(this.routes[i].params.action) != 'undefined' &&
          this.routes[i].params.action != params.action) {
        continue;
      }

      url = this.routes[i].stringify(params);
      if (url) {
        break;
      }
    }

    // no love? return false
    if (!url) {
      return false;
    }

    /*
    // build the possibly empty query string
    var qs = require('../../deps/qs').stringify(url[1]);

    // if there is a query string...
    if (qs.length > 0) {
      return url[0] + '?' + qs;
    }
    */

    // just return the url
    return url[0];
  };

  /*
   * Route - turns strings into magical ponies that come when you call them
   *
   * ex: route = Route('/:controller/:action/:id(.:format)')
   * ex: route = Route('/:controller/:action(/:id)(.:format)', 'GET')
   * ex: route = Route('/:controller/:action(/:id)(.:format)',
   *   { controller:'snow_dogs', acton:'show' })
   * ex: route = Route('/:controller/:action/:id(.:format)', 'GET', { id:/\d+/ })
   *
   * Pretty familiar to anyone who's used Merb/Rails - called by Router.match()
   */
  var Route = function () {

    // regexen crossing
    // matches keys, BEWARE: keys containing a "-" will need to be references
    // in params['key-name'] notation
    var KEY = /:([a-zA-Z_\-][\w\-]*)/;
    // optional group (the part in parens)
    var OGRP = /\(([^)]+)\)/;
    // breaks a string into atomic parts: ogrps, keys, then everything else
    var PARTS = /\([^)]+\)|:[a-zA-Z_][\w\-]*|[\w\-_\\\/\.]+/g;
    var METHODS = /GET|POST|PUT|DELETE/;

    // parse th'args
    var path;
    var opts = {};
    this.optional = false; // for nested optional url segments like (.:format)

    var args = Array.prototype.slice.call(arguments);
    var arg;
    for (var i = 0, ii = args.length; i < ii; i++) {
      arg = args[i];
      if (i === 0) { // path is always first
        path = arg;
      } else if (typeof(arg) == 'string') { // method is the only other string
        this.method = arg.toUpperCase();
      } else if (typeof(arg) == 'boolean') { // optional
        this.optional = arg;
      } else { // opts hash
        opts = arg || {};
      }
    }

    // route-specific params
    this.params = {};
    this.parts = [];
    this.name = null;

    // returns a composite regex string of all route parts
    this.regexString = function () {
      var ret = '';
      // build master regex from params hash
      for (var i in this.parts) {
        var part = this.parts[i];
        if (part instanceof Key) {
          ret += part.regexString();
        } else if (part instanceof Route) {
          ret += part.regexString();
        } else { // string
          ret += regExpEscape(part);
        }
      }
      if (this.optional) {
        return '('+ret+')?';
      }
      return '('+ret+')';
    };

    // builds & tests on a full regex of the entire path
    this.test = function (string) {
      return RegExp('^' + this.regexString() + '(\\\?.*)?$').test(string);
    };

    /*
     * Route.to({ controller: 'SnowDogs', action: 'index' })
     *
     * just mixes in route params
     *
     * returns the Route for chaining
     */
    this.to = function (params) {
      geddy.mixin(this.params, params);
      return this; // chainable
    };

    /*
     * Route.name('ponies')
     *
     * just sets the route name - NAMED ROUTES ARE NOT CURRENTLY USED
     *
     * returns: the Route for chaining
     */
    this.name = function (name) {
      this.name = name;
      return this; // chainable
    };

    /*
     * Route.stringify(params)
     *
     * builds a string url for this Route from a params object
     *
     * returns: [ "url", [leftover params] ]
     *
     * ** this is meant to be called & modified by Router.url()
     */
    this.stringify = function (params) {
      var url = []; // urls start life as an array to enble a second pass

      for (var i in this.parts) {
        var part = this.parts[i];
        if (part instanceof Key) {
          if (typeof(params[part.name]) != 'undefined' &&
              part.regex.test(params[part.name])) {
            // there's a param named this && the param matches the key's regex
            url.push(part.url(params[part.name])); // push it onto the stack
            delete params[part.name]; // and remove from list of params
          } else if (this.optional) {
            // (sub)route doesn't match, move on
            return false;
          }
        } else if (part instanceof Route) {
          // sub-routes must be handled in the next pass
          // to avoid leftover param duplication
          url.push(part);
        } else { // string
          url.push(part);
        }
      }

      // second pass, resolve optional parts
      for (var i in url) {
        if (url[i] instanceof Route) {
          url[i] = url[i].stringify(params); // recursion is your friend
          // it resolved to a url fragment!
          if (url[i]) {
            // replace leftover params hash with the new, smaller leftover params hash
            params = url[i][1];
            // leave only the string for joining
            url[i] = url[i][0];
          } else {
            delete url[i]; // get rid of these shits
          }
        }
      }

      // Remove slashes from the URL parts, remove empty parts
      url = url.map(function (part) {
        return part.replace(/\//g, '');
      }).filter(function (part) {
        return !!part;
      });

      for (var i in this.params) {
        // remove from leftovers, they're implied in the to() portion of the route
        delete params[i];
      }

      return [url.join('/'), params];
    };

    this.keysAndRoutes = function () {
      // Keys and routes, not Kernighan and Ritchie
      var knr = [];
      for (var i in this.parts) {
        if (this.parts[i] instanceof Key || this.parts[i] instanceof Route) {
          knr.push(this.parts[i]);
        }
      }
      return knr;
    };

    this.keys = function () {
      var keys = [];
      for (var i in this.parts) {
        if (this.parts[i] instanceof Key) {
          keys.push(this.parts[i]);
        }
      }
      return keys;
    };

    this.keyNames = function () {
      var keys = this.keys();
      var names = [];
      for (var i in keys) {
        names.push(keys[i].name);
      }
      return names;
    };

    /*
     * parses a URL into a params object
     *
     * route.parse(url, method)
     *
     * returns: a params hash || false (if the route doesn't match)
     *
     * ** this is meant to be called by Router.first() && Router.all()
     */
    this.parse = function (urlParam, method) {
      var err;
      // parse the URL with the regex & step along with the parts,
      // assigning the vals from the url to the names of the keys as we go (potentially stoopid)

      // let's chop off the QS to make life easier
      var path = urlParam.split(/\?|;/)[0];
      var params = {method:method};

      for (var key in this.params) { params[key] = this.params[key]; }

      // if the route doesn't match the regex, gtfo
      if (!this.test(path)) {
        return false;
      }

      // if the method doesn't match, gtfo immediately
      if (typeof this.method != 'undefined' && this.method != params.method) {
        err = new Error('Method Not Allowed');
        err.allowed = this.method;
        return err;
      }

      // parse the URL with the regex
      var parts = new RegExp('^' + this.regexString() + '$').exec(path);
      var j = 2; // index of the parts array, starts at 2 to bypass the entire match string & the entire match

      var keysAndRoutes = this.keysAndRoutes();

      for (var i in keysAndRoutes) {
        if (keysAndRoutes[i] instanceof Key) {
          if (keysAndRoutes[i].test(parts[j])) {
            params[keysAndRoutes[i].name] = parts[j];
          }
        } else if (keysAndRoutes[i] instanceof Route) {
          if (keysAndRoutes[i].test(parts[j])) {
            // parse the subroute
            var subparams = keysAndRoutes[i].parse(parts[j], method);
            geddy.mixin(params, subparams);
            // advance the parts pointer by the number of submatches
            j+= parts[j].match(keysAndRoutes[i].regexString()).length-2 || 0;
          } else {
            j++;
          }
        }
        j++;
      }

      // Camelize the controller-name
      if (params.controller) {
        params.controller = geddy.string.camelize(params.controller,
            {initialCap: true});
      }

      return params;
    };

    /*
     * keys - the building blocks of routes
     *
     * ex: key = new Key('name')
     * ex: key = new Key('name', true)
     * ex: key = new Key('name', /\w+/, rue)
     * ex: key = new Key('name', 'ted')
     * ex: key = new Key('id', /\d+/)
     *
     */
    var Key = function () {

      // parse th'args
      this.optional = false;
      this.regex = /[\w\-]+/; // default url-friendly regex

      var args = Array.prototype.slice.call(arguments);
      var arg;
      for (var i = 0, ii = args.length; i < ii; i++) {
        arg = args[i];
        if (i === 0) { // name is always first
          this.name = arg;
        }
        // optional flag - *for future use* : /route/? would make the trailing slash optional
        else if (typeof(arg) == 'boolean') {
          this.optional = arg;
        }
        // regex match
        else if (arg instanceof RegExp) {
          this.regex = arg;
        }
        // must be a regex in string-ish form
        else {
          this.regex = RegExp(arg);
        }
      }

      // special defaults for controllers & actions, which will always be function names
      if (this.name == 'controller' || this.name == 'action') {
        this.regex = /[a-zA-Z_][\w\-]+/;
      }

      // makes a regex string of the key - used by this.test()
      this.regexString = function () {
        var ret = String(this.regex).replace(/^\//, '').replace(/\/[gis]?$/, '');
        if (this.optional) {
          return '(' + ret + ')?';
        }
        return '(' + ret + ')';
      };

      // validates a string using the key's regex pattern
      this.test = function (string) {
        return new RegExp('^'+this.regexString()+'$').test(string);
      };

      this.url = function (string) {
        if (this.test(string)) {
          // snake_caseify the controller, if there is one
          if (this.name == 'controller') {
            return geddy.string.decamelize(string);
          }
          return string;
        }
        return false; // doesn't match, let it go
      };

      return this; // don't know if this is needed, since 'new Key' implies it
    };

    // path parsing
    while (part = PARTS.exec(path)) {
      this.parts.push(part);
    }

    // have to do this in two passes due to RegExp execution limits
    for (var i in this.parts) {
      if (OGRP.test(this.parts[i])) { // optional group
        this.parts[i] = new Route(OGRP.exec(this.parts[i])[1], true, opts);
      } else if (KEY.test(this.parts[i])) { // key
        var keyname = KEY.exec(this.parts[i])[1];
        if (opts[keyname]) { // are there match conditions for this key?
          this.parts[i] = new Key(keyname, opts[keyname]);
        } else{
          this.parts[i] = new Key(keyname);
        }
      } else{ // string
        this.parts[i] = String(this.parts[i]);
      }
    }

    return this;

  }; // Route

}; // Router

module.exports.RegExpRouter = Router;


