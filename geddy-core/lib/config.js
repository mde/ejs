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
var geddy = require('geddy-core/lib/geddy');

var Config = function (passedOpts) {

  // App directory is always passed in on the passedOpts object.
  // Have to know this to pull in the app-specific config
  this.dirname = passedOpts.geddyRoot;
  // Also need to know this to know what env we're starting up
  this.environment = passedOpts.environment || 'development';

  // Defaults
  this.hostname = null;
  this.port = 4000;
  this.staticFilePath = this.dirname + '/public';
  this.detailedErrors = true;
  this.plugins = {};
  this.workers = this.environment == 'development' ? 1 : 2;

  this.sessions = {
    store: 'memory',
    key: 'sid',
    expiry: 14 * 24 * 60 * 60
  };

  /*
  this.database = {
    adapter: 'sqlite'
    , dbName: 'geddy_db'
  };
  this.database = {
    adapter: 'postgresql'
    , hostname: 'localhost'
    , dbName: 'geddy_db'
    , username: 'postgres'
    , password: null
  };
  this.database = {
    adapter: 'couchdb'
    , hostname: 'localhost'
    , dbName: 'geddy_db'
    , dbPort: 5984
  };
  this.sessions = {
    store: 'couchdb,
    , key: 'sid,
    , expiry: 14 * 24 * 60 * 60
    , hostname: 'localhost'
    , dbName: 'geddy_sessions'
    , port: 5984
  };

  this.plugins = {
    'Auth': {
      // Pluggable auth types to check, in order
      authTypes: ['Cookie', 'Basic']
      // The key to look for in the session to indicate logged-in status
      ' authedSessionKey: 'login'
      // The page to redirect to when hitting an auth-required HTML page
      , htmlRedirect: '/login'
    }
  };
  */

  this.dateFormat = '%m/%d/%Y';
  //this.dateFormat = '%F';
  this.timeFormat = '%T';

  // Override with app-level passedOpts
  var localOpts = require(this.dirname + '/config/environments/' + this.environment);
  geddy.util.meta.mixin(this, localOpts, true);

  // Override those with passed-in passedOpts
  if (passedOpts.port) {
    passedOpts.port = parseInt(passedOpts.port, 10);
  }
  geddy.util.meta.mixin(this, passedOpts, true);

};

exports.Config = Config;
