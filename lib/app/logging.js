
var logging = {
  initRequestLogger: function (reqUrl, reqObj, respObj, method, accessTime) {
    // Probably should proxy events for wrapped Response obj
    respObj.resp.addListener('finish', function () {
      var id = respObj._geddyId
        , stat = respObj.resp.statusCode
        , level = parseInt(stat, 10)
        , logMsg;

      // Status code representation for logging
      if (level > 499) {
        level = 'error';
      }
      else level = 'access';

      // Apache extended log-format
      // TODO: Allow customizing this format
      logMsg = logging.formatEntry(reqUrl, reqObj, respObj, method, accessTime);

      try {
        geddy.log[level](logMsg);
      }
      catch(e) {
        geddy.log.error('Logging failed for request, id ' + id);
      }

      geddy.inFlight.removeEntry(id);
    });
  }

, formatEntry: function (url, req, resp, method, accessTime) {
    // Apache extended log-format
    // TODO: Allow customizing this format
    logMsg = req.connection.remoteAddress + ' ' +
        '- ' +
        '- ' +
        '[' + new Date(accessTime) + '] ' +
        '"' + method + ' ' + url + ' ' +
          req.httpVersion + '" ' +
        resp.resp.statusCode + ' ' +
        (resp.resp._length || '-') + ' ' +
        '"' + encodeURI(req.headers['referer'] || '-') + '" ' +
        '"' + (req.headers['user-agent'] || '-') + '"';

    // Append saved stack, if there is one, for error logs
    if (resp.resp._stack) {
      logMsg += '\n' + resp.resp._stack;
    }

    return logMsg;
  }
};

module.exports = logging;
