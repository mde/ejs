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

var sys = require('sys');
if (typeof util == 'undefined') { var util = {}; }
util.string = require('../../geddy-util/lib/string');
util.meta = require('../../geddy-util/lib/meta');

// need this, but maybe there's a better spot for it?
RegExp.escape = (function() {
  var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
  sRE = new RegExp( '(\\' + specials.join('|\\') + ')', 'g' );
  return function(text) { return text.replace(sRE, '\\$1'); }
})();

/*
 * Simple router for Node -- setting up routes looks like this:
 *
 * r = new Router();
 * r.match('/').to( { controller: 'Main', action: 'index' } ).name('main');
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
   * r.match('/:controller/:action(/:id)(.:extension)','GET',{ id:/\d+/ }).to(......)
   *
   * path is mandatory (duh)
   * method is optional, routes without a method will apply in all cases
   * the options hash (which is also optional) compares either a regex or a string to the key's value in the path
   *
   * returns: Route (for chaining)
   */
  this.match = function ( ) {
    var path, method, opts;
    // args
    for ( var i in arguments ) {
      var arg = arguments[i];
      if ( i == 0 ) { // path is always first
        path = arg;
      } else if ( typeof(arg) == 'string' ) { // method is the only other string
        method = arg;
      } else { // opts hash
        opts = arg || {};
      }
    }
    
    route = new Route(path, method, opts);
    this.routes.push(route);

    // TODO: set route options & regex
    
    return route;
  }


  /*
   * Router.resource()
   *
   * r.resource('Products')
   *
   * generates standard resource routes for a controller name
   *
   * returns: array of Routes (for now)
   */
  this.resource = function ( res ) {
    var controller = util.string.camelize(res, true);
    var cslug = util.string.decamelize(res);
    return [
      this.match('/'+cslug+'(.:extension)','GET').to({ controller: controller, action: 'index' }),
      this.match('/'+cslug+'/add(.:extension)','GET').to({ controller: controller, action: 'add' }),
      this.match('/'+cslug+'/:id(.:extension)','GET').to({ controller: controller, action: 'show' }),
      this.match('/'+cslug+'/:id/edit(.:extension)','GET').to({ controller: controller, action: 'edit' }),
      this.match('/'+cslug+'(.:extension)','POST').to({ controller: controller, action: 'create' }),
      this.match('/'+cslug+'/:id(.:extension)','PUT').to({ controller: controller, action: 'update' }),
      this.match('/'+cslug+'/:id(.:extension)','DELETE').to({ controller: controller, action: 'remove' })
    ]
  }
  
  
  // find the first route that match the path & method
  /*
   * router.first( '/snow_dogs/5', 'GET' ) => { controller: 'SnowDogs', action: 'show', id: 5, method: 'GET' }
   *
   * find & return a params hash from the first route that matches
   *
   * if there's no match, this will return false
   */
  this.first = function ( path, method ) {
    var route = false;
    for ( var i in this.routes ) {
      // if the method doesn't match: jog on
      if ( typeof(this.routes[i].method) != 'undefined' && this.routes[i].method != method ) continue;
      // attempt the parse
      route = this.routes[i].parse( path, method );
      if ( route ) return route;
    }
    return false;
  }
  
  
  /*
   * router.all( '/snow_dogs/bob', 'GET' ) => 
   *  [
   *    { controller: 'SnowDogs', action: 'show', id: 'bob', method: 'GET' },
   *    { controller: 'SnowDogs', action: 'bob', method: 'GET' }
   *  ]
   *
   * find & return a params hash from ALL routes that match
   *
   * if there's no matches, returns an empty array
   */
  this.all = function ( path, method ) {
    var ret = [];
    var route = false;
    for ( var i in this.routes ) {
      // if the method doesn't match: jog on
      if ( typeof(this.routes[i].method) != 'undefined' && this.routes[i].method != method ) continue;
      // attempt the parse
      route = this.routes[i].parse( path, method );
      if ( route ) ret.push(route);
    }
    return ret;
  }
  
  
  /*
   * router.url( { controller: 'SnowDogs', action: 'show', id: 5 } ) => '/snow_dogs/5'
   *  
   * router.url( { controller: 'SnowDogs', action: 'show', id: 5, extension: 'json' } ) => '/snow_dogs/5.json'
   *  
   * generates a URL from a params hash
   *
   * returns false if there are no suitable routes
   */
  this.url = function (params) {
    var url = false;
        
    // iterate through the existing routes until a suitable match is found
    for ( var i in this.routes ) {
      // do the controller & acton match?
      if ( typeof(this.routes[i].params.controller) != 'undefined' && this.routes[i].params.controller != params.controller ) continue;
      if ( typeof(this.routes[i].params.action) != 'undefined' && this.routes[i].params.action != params.action ) continue;
      // attempt the stringification with defaults mixed in
      params = util.meta.mixin( {controller:'Application', action:'index' }, params )
      url = this.routes[i].stringify(params)
      if ( url != false ) break;
    } 

    // no love? return false
    if ( url == false ) return false;
    
    // build the possibly empty query string
    var qs = require('querystring').stringify(url[1]);
    
    // if there is a query string...
    if ( qs.length > 0 ) return url[0] + '?' + qs;
    
    // just return the url
    return url[0];
  }

  /*
   * Route - turns strings into magical ponies that come when you call them
   *
   * ex: route = Route( '/:controller/:action/:id(.:extension)' )
   * ex: route = Route( '/:controller/:action(/:id)(.:extension)', 'GET' )
   * ex: route = Route( '/:controller/:action(/:id)(.:extension)', { controller:'snow_dogs', acton:'show' } )
   * ex: route = Route( '/:controller/:action/:id(.:extension)', 'GET', { id:/\d+/ } )
   *
   * Pretty familiar to anyone who's used Merb/Rails - called by Router.match()
   */
  var Route = function () {
    
    // regexen crossing
    const KEY = /:([a-zA-Z_\-][\w\-]*)/; // matches keys, BEWARE: keys containing a "-" will need to be references in params['key-name'] notation
    const OGRP = /\(([^)]+)\)/; // optional group (the part in parens)
    const PARTS = /\([^)]+\)|:[a-zA-Z_][\w\-]*|[\w\-_\\\/\.]+/g; // breaks a string into atomic parts: ogrps, keys, then everything else
    const METHODS = /GET|POST|PUT|DELETE/;

    // parse th'args
    var path;
    var opts = {};
    this.optional = false; // for nested optional url segments like (.:extension)
    
    for ( var i in arguments ) {
      var arg = arguments[i];
      if ( i == 0 ) { // path is always first
        path = arg;
      } else if ( typeof(arg) == 'string' ) { // method is the only other string
        this.method = arg.toUpperCase();
      } else if ( typeof(arg) == 'boolean' ) { // optional
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
    this.regex_string = function(){
      var ret = '';
      // build master regex from params hash
      for ( var i in this.parts ) {
        var part = this.parts[i];
        if ( part instanceof Key ) {
          ret += part.regex_string();
        } else if ( part instanceof Route ){
          ret += part.regex_string();
        } else { // string
          ret += RegExp.escape(part);
        }
      }
      if ( this.optional ) return '('+ret+')?';
      return '('+ret+')';
    };
  
  
    // builds & tests on a full regex of the entire path
    this.test = function ( string ) {
      return RegExp('^' + this.regex_string() + '(\\\?.*)?$').test(string);
    };

    
    /*
     * Route.to( { controller: 'SnowDogs', action: 'index' } )
     *
     * just mixes in route params
     *
     * returns the Route for chaining
     */
    this.to = function (params) {
      util.meta.mixin( this.params, params );
      return this; // chainable
    }

    
    /*
     * Route.name('ponies')
     *
     * just sets the route name - NAMED ROUTES ARE NOT CURRENTLY USED
     *
     * returns: the Route for chaining
     */
    this.name = function ( name ) {
      this.name = name;
      return this; // chainable
    }
    
    
    /*
     * Route.stringify( params )
     *
     * builds a string url for this Route from a params object
     *
     * returns: [ "url", [leftover params] ]
     *
     * ** this is meant to be called & modified by Router.url()
     */
    this.stringify = function ( params ) {
      
      var url = []; // urls start life as an array to enble a second pass
      
      for ( var i in this.parts ) {
        var part = this.parts[i];
        if ( part instanceof Key ) {
          if ( typeof(params[part.name]) != 'undefined' && part.regex.test(params[part.name]) ){
            // there's a param named this && the param matches the key's regex
            url.push( part.url(params[part.name]) ); // push it onto the stack 
            delete params[part.name]; // and remove from list of params              
          } else if (this.optional) {
            // (sub)route doesn't match, move on
            return false;
          }
        } else if ( part instanceof Route ){
          // sub-routes must be handled in the next pass
          // to avoid leftover param duplication
          url.push(part);
        } else { // string
          url.push(part);
        }
      }
      
      // second pass, resolve optional parts
      for ( var i in url ) {
        if ( url[i] instanceof Route ) { 
          url[i] = url[i].stringify(params); // recursion is your friend
          if ( url[i] != false ) { // it resolved to a url fragment!
            params = url[i][1]; // replace leftover params hash with the new, smaller leftover params hash
            url[i] = url[i][0]; // leave only the string for joining            
          } else {
            delete url[i]; // get rid of these shits
          }
        }
      }
      
      for ( var i in this.params ) {
        delete params[i]; // remove from leftovers, they're implied in the to() portion of the route
      }
 
      return [ url.join(''), params ];
    } // this.url()
    
    this.keys_and_routes = function () {
      var knr = [];
      for ( var i in this.parts ) {
        if ( this.parts[i] instanceof Key || this.parts[i] instanceof Route ) knr.push(this.parts[i]);
      }
      return knr;
    }

    this.keys = function () {
      var keys = [];
      for ( var i in this.parts ) {
        if ( this.parts[i] instanceof Key ) keys.push(this.parts[i]);
      }
      return keys;
    }

    this.key_names = function () {
      var keys = this.keys();
      var names = [];
      for ( var i in keys ) {
        names.push(keys[i].name);
      }
      return names;
    }
    

    /*
     * parses a URL into a params object
     *
     * route.parse( url, method )
     *
     * returns: a params hash || false (if the route doesn't match)
     *
     * ** this is meant to be called by Router.first() && Router.all() 
     */
    this.parse = function ( url, method ) {
      
      // parse the URL with the regex & step along with the parts, 
      // assigning the vals from the url to the names of the keys as we go (potentially stoopid)
      
      // let's chop off the QS to make life easier
      var url = require('url').parse(url);
      var path = url.pathname;
      var params = {method:method};
      
      for (var key in this.params ) { params[key] = this.params[key] } 

      // if the method doesn't match, gtfo immediately
      if ( typeof(this.method) != 'undefined' && this.method != params.method ) return false;

      // if the route doesn't match the regex, gtfo
      if ( !this.test(path) ) return false;

      // parse the URL with the regex
      var parts = new RegExp( '^' + this.regex_string() + '$' ).exec(path);
      var j = 2; // index of the parts array, starts at 2 to bypass the entire match string & the entire match

      var keys_and_routes = this.keys_and_routes();      
      

      for ( var i in keys_and_routes ) {        
        if ( keys_and_routes[i] instanceof Key ) {
          if ( keys_and_routes[i].test(parts[j]) ) {
            params[keys_and_routes[i].name] = parts[j];
          }
        } else if ( keys_and_routes[i] instanceof Route ) {
          if ( keys_and_routes[i].test(parts[j]) ) {
            // parse the subroute
            var subparams = keys_and_routes[i].parse(parts[j],method);
            util.meta.mixin(params,subparams);
            // advance the parts pointer by the number of submatches
            j+= parts[j].match(keys_and_routes[i].regex_string()).length-2 || 0;
          }else{
            j+=1; 
          }
        }
        j+=1;
      }
      
      // camelize the controller
      if ( params.controller ) params.controller = util.string.camelize(params.controller,true);

      return params;
    }

    
    /*
     * keys - the building blocks of routes
     *
     * ex: key = new Key('name')
     * ex: key = new Key('name',true)
     * ex: key = new Key('name',/\w+/,true)
     * ex: key = new Key('name','ted')
     * ex: key = new Key('id',/\d+/)
     *
     */
    var Key = function () {

      // parse th'args
      this.optional = false;
      this.regex = /[\w\-]+/; // default url-friendly regex

      for ( var i in arguments ) {
        var arg = arguments[i];
        if ( i == 0 ) { // name is always first
          this.name = arg;
        } else if ( typeof(arg) == 'boolean' ) { // optional flag - *for future use* : /route/? would make the trailing slash optional
          this.optional = arg;
        } else if ( arg instanceof RegExp ) { // regex match
          this.regex = arg;
        } else { // must be a regex in string-ish form
          this.regex = RegExp(arg);
        }
      }

      // special defaults for controllers & actions, which will always be function names
      if ( this.name == 'controller' || this.name == 'action') this.regex = /[a-zA-Z_][\w\-]+/; 

      // makes a regex string of the key - used by this.test()
      this.regex_string = function () {
        var ret = String(this.regex).replace(/^\//,'').replace(/\/[gis]?$/,'');
        if (this.optional) return '(' + ret + ')?';
        return '(' + ret + ')';
      };

      // validates a string using the key's regex pattern
      this.test = function ( string ) {
        return new RegExp('^'+this.regex_string()+'$').test(string);
      };

      this.url = function ( string ) {
        if ( this.test(string) ) {
          // snake_caseify the controller, if there is one
          if ( this.name == 'controller' ) return util.string.decamelize(string);
          return string;
        }
        return false; // doesn't match, let it go
      }

      return this; // don't know if this is needed, since 'new Key' implies it 
    }

    // path parsing
    while (part = PARTS.exec(path) ){
      this.parts.push(part);
    }
    
    // have to do this in two passes due to RegExp execution limits    
    for (var i in this.parts ){
      if(OGRP.test(this.parts[i])) { // optional group
        this.parts[i] = new Route(OGRP.exec(this.parts[i])[1],true,opts);
      }else if(KEY.test(this.parts[i])) { // key
        var keyname = KEY.exec(this.parts[i])[1];
        if( opts[keyname] ) { // are there match conditions for this key?
          this.parts[i] = new Key(keyname, opts[keyname] );
        }else{
          this.parts[i] = new Key(keyname);
        }        
      }else{ // string
        this.parts[i] = String(this.parts[i]);
      }
    }  

    return this;

  } // Route

} // Router

exports.Router = Router;
