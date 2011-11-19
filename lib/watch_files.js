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
var fs = require('fs')
  , watchFiles = new (function () {
  var JS_PAT = /\.js$/;

  // Recursively watch files with a callback
  var watch = function (path, callback) {
    fs.stat(path, function (err, stats) {
      if (err) {
        return false;
      }
      if (stats.isFile() && JS_PAT.test(path)) {
        console.log('watching ' + path);
        fs.watchFile(path, callback);
      }
      else if (stats.isDirectory()) {
        fs.readdir(path, function (err, files) {
          if (err) {
            return log.fatal(err);
          }
          for (var f in files) {
            watch(path + '/' + files[f], callback);
          }
        });
      }
    });
  };

  this.watch = function () {
    watch.apply(this, arguments);
  };
})();

module.exports = watchFiles;

