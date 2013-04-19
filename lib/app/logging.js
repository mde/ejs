
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
      logMsg = reqObj.connection.remoteAddress + ' ' +
          '- ' +
          '- ' +
          '[' + new Date(accessTime) + '] ' +
          '"' + method + ' ' + reqUrl + ' ' +
            reqObj.httpVersion + '" ' +
          stat + ' ' +
          (respObj.resp._length || '-') + ' ' +
          '"' + encodeURI(reqObj.headers['referer'] || '-') + '" ' +
          '"' + (reqObj.headers['user-agent'] || '-') + '"';

      try {
        geddy.log[level](logMsg);
      }
      catch(e) {
        geddy.log.error('Logging failed for request, id ' + id);
      }

      geddy.inFlight.removeEntry(id);
    });
  }
};

module.exports = logging;
