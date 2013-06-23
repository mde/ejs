var utils = require('utilities')
  , querystring = require('../../deps/qs')
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
    var self = this
      , i18nInst = new i18n.I18n(this);
    this.i18n = i18nInst;
    // Delegate aliases
    ['getLocale', 'setLocale'].forEach(function (m) {
      self[m] = function () {
        i18nInst[m].apply(i18nInst, arguments);
      };
    });
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
    var self = this
      , body = ''
      , bodyParams
      , req
      , contentType;

    // If this is the Node v0.8 buffered request, use the
    // raw reqeust object wrapped inside -- if Node v0.10,
    // just use the normal request object
    req = this.request.req || this.request;

    contentType = req.headers['content-type'];

    // If it's a plain form-post, save the request-body, and parse it into
    // params as well
    if ((req.method == 'POST' || req.method == 'PUT') &&
        (contentType &&
          (contentType.indexOf('form-urlencoded') > -1 ||
           contentType.indexOf('application/json') > -1))) {

      bodyParams = {};
      // Node 0.10, new streams
      // FIXME: Assumes the entire request body is in the buffer,
      // probably not right
      if (typeof req.read == 'function') {
        req.addListener('readable', function (data) {
          body += req.read();
        });
      }
      // Node 0.8, old streams
      else {
        req.addListener('data', function (data) {
          body += data.toString();
        });
      }
      // Parse the body into params once it's finished
      req.addListener('end', function () {
        if (contentType.indexOf('form-urlencoded') > -1) {
          bodyParams = querystring.parse(body);
        }
        else if (contentType.indexOf('application/json') > -1) {
          try {
            bodyParams = JSON.parse(body);
          }
          catch (e) {}
        }

        geddy.mixin(self.params, bodyParams);

        req.body = body;

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
