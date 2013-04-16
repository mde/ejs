var Flash = function (session) {
  this.session = session;

  this.init = function () {
    if (!this.session.get('flashMessages')) {
      this.session.set('flashMessages',{
        error:[],
        info:[],
        success:[]
      });
    }
  };

  this.get = function (type) {
    this.init();

    var messages = this.session.get('flashMessages');

    var _messages;
    if (typeof messages[type] == "object") {
      _messages = messages[type];
      messages[type] = [];
      this.session.set('flashMessages',messages);
      return _messages;
    }
    return [];
  };

  this.add = function (message, t) {
    this.init();

    var type = t || 'info';

    var messages = this.session.get('flashMessages');

    // convert non strings to strings
    if (typeof message != 'string') {
      if (typeof message.toString == 'function') {
        message = message.toString();
      }
    }
    if (typeof messages[type] == "undefined") {
      messages[type] = [];
    }
    messages[type].push(message);
    this.session.set('flashMessages',messages);
  };

  this.has = function () {
    this.init();

    var messages = this.session.get('flashMessages');

    for(var type in messages) {
      if (messages[type].length > 0) {
        return true;
      }
    }

    return false;
  };
};

exports.Flash = Flash;
