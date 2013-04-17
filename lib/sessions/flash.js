var FLASH_KEY = 'flashMessages';

var Flash = function (session) {
  this.session = session;
  this.used = [];
  this.messages = this.session.get(FLASH_KEY) || {};
  this.used = Object.keys(this.messages);
};

Flash.prototype = new (function () {

  this.close = function () {
    this.sweep();
    this.session.set(FLASH_KEY, this.messages);
  };

  this.sweep = function () {
    var messages = this.messages;
    this.used.forEach(function (key) {
      delete messages[key];
    });
  };

  /*
    @name Flash#get
    @public
    @function
    @description Get messages of a particular type
    @param {String} [type] the type of messages to return (e.g.,
        error, info, success)
    @returns {Object} message of a particular type, or all
        messages if no type is passed
  */
  this.get = function (type) {
    return type ? this.messages[type] : this.messages;
  };

  /*
    @name Flash#set
    @public
    @function
    @description Add a message of a particular type
    @param {String} [type] the type of message this is (e.g.,
        error, info, success)
    @param {String} message message to display as a Flash, or
        replace all messages
  */
  this.set = function (/*[type], message*/) {
    var type
      , message;
    if (arguments.length > 1) {
      type = arguments[0];
      message = arguments[1];
      this.messages[type] = message;
    }
    else {
      message = arguments[0];
      this.messages = message;
    }
  };

  this.keep = function (type) {
    this.used = this.used.filter(function (key) {
      return key != type;
    });
  };

  this.discard = function (type) {
    if (!this.used.some(function (key) {
      return key == type;
    })) {
      this.used.push(type);
    }
  };

  this.isEmpty = function () {
    var messages = this.messages;
    for (var type in messages) {
      if (messages[type]) {
        return false;
      }
    }
    return true;
  };

  /*
    @name Flash#hasMessages
    @public
    @function
    @description Indicates whether there are any Flash messages
        present in the session or not
    @returns {Boolean} True if there are any messages; false if not
  */
  this.hasMessages = function () {
    return !this.isEmpty();
  };

  (function (self) {
    // In this case, 'self' refers to the proto, defining the
    // shortcut flash methods here
    ['alert', 'error', 'success', 'info'].forEach(function (type) {
      self[type] = function (message) {
        return message ? this.set(type, message) : this.get(type);
      };
    });
  })(this);

})();


exports.Flash = Flash;
