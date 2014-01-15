var utils = require('utilities');

module.exports = new (function () {
  this.init = function (app, callback) {
    var cfg = app.config.mailer
      , mailer
      , msg
      , transport;
    if (cfg) {
      msg = 'Geddy mailer support requires Nodemailer. Try `npm install nodemailer`.'
      mailer = utils.file.requireLocal('nodemailer', msg);
      transport = cfg.transport;
      app.mailer = mailer.createTransport(transport.type, transport.options);
    }
    callback();
  };

})();



