
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
      //Error.captureStackTrace(this);
    }
    errorConstructor.prototype = new Error();
    return errorConstructor; 
  };
  for (var code in _errorTypes) {
    // Strip spaces
    errorType = _errorTypes[code].replace(' ', '');
    this[errorType + 'Error'] = createConstructor(code, errorType);
  }
}();

for (var p in errors) { exports[p] = errors[p]; }


