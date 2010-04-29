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
var response = require('geddy-core/lib/response');
var sys = require('sys');

var errors = new function () {
  var _errorTypes = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    406: 'Not Acceptable',
    500: 'Internal Server Error'
  };
  var errorType;
  var errorConstructor;
  var createConstructor = function (code, errorType) {
    errorConstructor = function (message) {
      this.statusCode = code;
      this.statusText = errorType;
      this.message = message || errorType;
      Error.captureStackTrace(this);
    }
    errorConstructor.prototype = new Error();
    return errorConstructor; 
  };
  for (var code in _errorTypes) {
    // Strip spaces
    errorType = _errorTypes[code].replace(/ /g, '');
    this[errorType + 'Error'] = createConstructor(code, errorType);
  }
  // For repetitively redundant name
  this.InternalServerError = this.InternalServerErrorError;

  this.respond = function (resp, e) {
    // The no-error error ... whoa, meta!
    if (!e) {
      throw new Error('No error to respond with.');
    }
    var r = new response.Response(resp);
    var code = e.statusCode || 500;
    var msg = '';
    if (config.detailedErrors) {
      msg = e.stack || e.message || String(e);
      msg = msg.replace(/\n/g, '<br/>');
    }
    msg = '<h3>Error: ' + code + ' ' +  _errorTypes[code] + '</h3>' + msg;
    r.send(msg, code, {'Content-Type': 'text/html'});
  };

}();

for (var p in errors) { exports[p] = errors[p]; }


