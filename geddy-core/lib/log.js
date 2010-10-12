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

// "stream" is a writable IO handle
//    ex: 
//var log = new function (stream, level) {
var log = new function () {
  // default profiles
  var profileLevels = {
    development: 'debug',
    production: 'fatal'
  };

  var levels  = {
    debug: false,
    info: false,
    warn: false,
    fatal: false
  };

  var maxLevel = profileLevels[geddy.config.environment];
  var hitMax = false;
  for (var level in levels) {
    if (level == maxLevel) {
      hitMax = true;
    }
    if (hitMax) {
      levels[level] = true;
    }
  }

  var msgs = []

  this.debug = function (msg) {
    if(levels.debug) {
      msgs.push(this.sanitize(msg));
    }
    return this;
  }
  
  this.info = function (msg) {
    if(levels.info) {
      msgs.push(this.sanitize(msg));
    }
    return this;
  }
  
  this.warn = function (msg) {
    if(levels.warn) {
      msgs.push(this.sanitize(msg));
    }
    return this;
  }
  
  this.fatal = function (msg) {
    this.flush()
    sys.puts("\n\nFATAL ERROR:\n\n"+this.sanitize(msg))
    return this; // not that it maters...
  }
  
  this.flush = function () {
    if (msgs.length > 0) {
      // file appending isn't working properly yet <------
      file = geddy.config.logFile;
      path = geddy.config.dirname + '/' + file

      sys.log(msgs.join("\n"));

      if (file) {
        var fs = require('fs')
        fs.open(path,'a+', 0666, function(err,fd){
          if (err) return sys.puts(sys.inspect(err));
          fs.write(fd,"\n\n" + (new Date().toString()) + " - " +
              msgs.join("\n"), null, 'utf8', function(err,data) {
            msgs = [];
            fs.close(fd);
            if (err) return sys.puts(sys.inspect(err));
          })
        })
      }else{ // other must wait to delete the msgs
        msgs = [];
      }
    }
    return this;
  }
  
  // helper methods
  this.sanitize = function(msg){
    if (typeof(msg)!='string') return sys.inspect(msg);
    return msg;
  }


}();

for (var p in log) { exports[p] = log[p]; }
