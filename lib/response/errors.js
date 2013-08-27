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
var response = require('./index')
  , errors;

errors = new function () {

  var self = this
    , errorType
    , createConstructor;

  this.errorTypes = {
      400: 'Bad Request'
    , 401: 'Unauthorized'
    , 403: 'Forbidden'
    , 404: 'Not Found'
    , 405: 'Method Not Allowed'
    , 406: 'Not Acceptable'
    , 500: 'Internal Server Error'
  };

  createConstructor = function (code, errorType) {
    var errorConstructor = function (message, stack) {
      this.statusCode = code;
      this.statusText = errorType;
      this.name = this.constructor.name;
      this.message = message || errorType;

      if (stack) {
        this.stack = stack;
      }
      else {
        Error.captureStackTrace(this, this.constructor);
      }
    };
    errorConstructor.prototype = new Error();
    errorConstructor.prototype.constructor = errorConstructor;

    return errorConstructor;
  };

  for (var code in this.errorTypes) {
    // Strip spaces
    errorText = this.errorTypes[code];
    errorType = errorText.replace(/ /g, '');

    this[errorType + 'Error'] = createConstructor(code, errorText);
  }
  // Avoid repetitively redundant name
  this.InternalServerError = this.InternalServerErrorError;
  delete this.InternalServerErrorError;

  this.respond = function (err, res) {
    // The no-error error ... whoa, meta!
    if (!err) {
      throw new Error('No error to respond with.');
    }
    var r = new response.Response(res)
      , code = err.statusCode || 500
      , msg = '';

    if (geddy.config.detailedErrors) {
      msg = err.stack || err.message || String(err);
      // FIXME this wrapping bullshit sucks
      if (res.resp) {
        res.resp._stack = msg;
      }
      else {
        res._stack = msg;
      }
    }

    msg = msg.replace(/\n/g, '<br/>');
    msg = '<h3>Error: ' + code + ' ' +  self.errorTypes[code] + '</h3>' + msg;
    r.send(msg, code, {'Content-Type': 'text/html'});
  };

}();

module.exports = errors;


