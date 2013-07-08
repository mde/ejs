/*
* A controller shim useful for testing the Responder
*/
var formats = ['html', 'json', 'xml', 'js', 'txt']
  , utils = require('utilities')
  , Shim = function (opts) {
      var self = this;

      //Defaults
      opts = opts || {};
      paramsParam = opts.params || {};
      format = opts.format || 'html';
      accepts = opts.accepts || '*/*';

      // Will hold a reference to the responder object
      this.responder;

      this.respondsWith = opts.respondsWith || formats;

      // Holds a response buffer that we can assert on
      this.buffer = '';
      this.flashMessage = null;
      this.redirectedTo = null;

      this.renderTemplate = function (d, opts, callback) {
        callback(JSON.stringify(d));
      };

      // Writes to the buffer so we can assert on it later
      this._doResponse = function (stat, headers, content, cb) {
        self.buffer = utils.mixin({},{headers:headers},{content: content});

        if(cb) {
          cb(self.buffer);
        }
      };

      // Saves to our instance var so we can assert on it later
      this.flash = {
        set:function (type, msg) {
          self.flashMessage = {type:type,msg:msg};
        }
      };

      // Saves to our instance var so we can assert on it later
      this.redirect = function (whereTo) {
        self.redirectedTo = whereTo;
      };

      this.error = function (err) {
        throw err;
      };

      this.params = {
        format: format
      };

      utils.mixin(this.params, paramsParam)

      this.request = {
        headers: {
          accepts: accepts
        }
      };

      return this;
    };

module.exports = Shim;