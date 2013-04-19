var utils = require('utilities')
  , sessions = require('../sessions')
  , CookieCollection = require('../cookies').CookieCollection
  , i18n = utils.i18n
  , init;

init = {

  cookies: function (cb) {
    this.cookies = new CookieCollection(this.request);
    cb();
  }

, i18n: function (cb) {
    this.i18n = new i18n.I18n(this);
    cb();
  }

, inFlight: function (cb) {
    // Register controller with the in-flight data
    // Shouldn't be necessary domains-based error-handling
    geddy.inFlight.updateEntry(this.request._geddyId, {
      controller: this
    });
    cb();
  }

, parseBody: function (cb) {
    var body = ''
      , bodyParams
      , reqObj = this.request
      , contentType = reqObj.headers['content-type'];

    // If it's a plain form-post, save the request-body, and parse it into
    // params as well
    if ((reqObj.method == 'POST' || reqObj.method == 'PUT') &&
        (contentType &&
          (contentType.indexOf('form-urlencoded') > -1 ||
           contentType.indexOf('application/json') > -1))) {

      bodyParams = {};
      // Node 0.10, new streams
      // FIXME: Assumes the entire request body is in the buffer,
      // probably not right
      if (typeof reqObj.read == 'function') {
        reqObj.addListener('readable', function (data) {
          body += reqObj.read();
        });
      }
      // Node 0.8, old streams
      else {
        reqObj.addListener('data', function (data) {
          body += data.toString();
        });
      }
      // Parse the body into params once it's finished
      reqObj.addListener('end', function () {
        if (contentType.indexOf('form-urlencoded') > -1) {
          bodyParams = querystring.parse(body);
        }
        else if (contentType.indexOf('application/json') > -1) {
          try {
            bodyParams = JSON.parse(body);
          }
          catch (e) {}
        }

        geddy.mixin(this.params, bodyParams);

        reqObj.body = body;

        cb();
      });
    }
    else {
      cb();
    }
  }

, session: function (cb) {
    var self = this;
    if (geddy.config.sessions) {
      this.session =
          new sessions.Session(this, function () {
        self.flash = self.session.flash;
        cb();
      });
    }
    else {
      cb();
    }
  }

};

module.exports = init;
