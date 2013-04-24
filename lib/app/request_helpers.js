var url = require('url')
  , utils = require('utilities')
  , Request = require('../request').Request
  , Response = require('../response').Response
  , InFlight = require('../in_flight').InFlight;

var requestHelpers = {
  getUrl: function (req) {
    var reqUrl = req.url;
    // Sanitize URL; reduce multiple slashes to single slash
    reqUrl = reqUrl.replace(/\/{2,}/g, '/');
    // Strip trailing slash for the purpose of looking for a matching
    // route (will still check for directory + index on statics)
    // Don't strip if the entire path is just '/'
    reqUrl = reqUrl.replace(/(.+)\/$/, '$1');
    return reqUrl;
  }

, getUrlParams: function (reqUrl) {
    return url.parse(reqUrl, true).query;
  }

, getMethod: function (reqUrl, urlParams, req) {
    var method;
    if (req.method.toUpperCase() == 'POST') {
      // POSTs may be overridden by the _method param
      if (urlParams._method) {
          method = urlParams._method;
      }
      // Or x-http-method-override header
      else if (req.headers['x-http-method-override']) {
        method = req.headers['x-http-method-override'];
      }
      else {
        method = req.method;
      }
    }
    else {
      method = req.method;
    }
    // Okay, let's be anal and force all the HTTP verbs to uppercase
    method = method.toUpperCase();
    return method;
  }

, enhanceRequest: function (req) {
    var reqObj;
    // TODO Replace this with readable-stream module for 0.8 support
    // Buffered request-obj -- buffer the request data,
    // and pass this proxy object to the controller
    if (typeof req.read != 'function') {
      reqObj = new Request(req);
    }
    // Not needed for 0.10
    else {
      reqObj = req;
      // Shim, method for so-called Connect-style middleware
      reqObj.query = Request.parseQuery(req.url);
    }
    return reqObj;
  }

, enhanceResponse: function (resp) {
    return new Response(resp);
  }

, getAccessTime: function () {
    return (new Date()).getTime()
  }

// Domains-based error-handling should make this less necessary
, initInFlight: function (reqObj, respObj, method, accessTime) {
    var inFlightId = geddy.inFlight.addEntry({
      request: reqObj
    , method: method
    , response: respObj
    , accessTime: accessTime
    });
    reqObj._geddyId = inFlightId;
    respObj._geddyId = inFlightId;
  }

, getParams: function (router, reqUrl, method) {
    var params = router.first(reqUrl, method);
    params.controller = utils.string.camelize(params.controller,
        {initialCap: true});
    return params;
  }
};

module.exports = requestHelpers;

