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

var fleegix = require('geddy-core/lib/fleegix');

var Config = function (opts) {
  
  this.environment = opts.environment || 'development';
  this.hostname = opts.host || null;
  this.port = parseInt(opts.port, 10) || 4000;
  this.dirname = opts.geddyRoot;
  this.staticFilePath = this.dirname + '/public';
  this.detailedErrors = true;
  this.plugins = {};
  
  this.sessions = {
    store: 'memory',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60
  };
  
  this.database = {
    adapter: 'postgresql',
    hostname: 'localhost',
    dbName: 'geddy_db',
    username: 'postgres',
    password: null
  };
  /*
  this.database = {
    adapter: 'couchdb',
    hostname: 'localhost',
    dbName: 'geddy_db',
    dbPort: 5984
  };
  this.sessions = {
    store: 'couchdb',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60,
    dbHostname: 'localhost',
    dbName: 'geddy_sessions',
    dbPort: 5984
  };
  
  this.plugins = {
    'Auth': {
      // Pluggable auth types to check, in order
      authTypes: ['Cookie', 'Basic'],
      // The key to look for in the session to indicate logged-in status
      authedSessionKey: 'login',
      // The page to redirect to when hitting an auth-required HTML page
      htmlRedirect: '/login'
    }
  };
  */

  this.dateFormat = '%m/%d/%Y';
  //this.dateFormat = '%F';
  this.timeFormat = '%T';

  // Override with app-level opts
  var opts = require(this.dirname + '/config/config');
  fleegix.mixin(this, opts, true);
};

exports.Config = Config;
