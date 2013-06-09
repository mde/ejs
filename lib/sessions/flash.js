var FLASH_KEY = 'flashMessages';

var Flash = function (session, config) {
  this.session = session;
  this.used = [];
  this.messages = this.session.get(FLASH_KEY) || {};
  //Mustache won't iterate over an object, so we'll copy messages into this array for it
  this.messagesArr = [];
  this.used = Object.keys(this.messages);
  this.config = config;
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
    if (type) {
      return this.messages[type];
    }
    else {
      return this.messages;
    }
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

    // If setting a single type
    if (arguments.length > 1) {
      type = arguments[0];
      message = arguments[1]
      //Find and store the CSS class for this flash type
      this.messages[type] = message;

    }
    // Just setting the entire messages object
    else {
      this.messages = arguments[0];
    }
  };

  this.keep = function (type) {
    if (type) {
      this.used = this.used.filter(function (key) {
        return key != type;
      });
    }
    else {
      this.used = [];
    }
  }

  this.discard = function (type) {
    var used = this.used;
    if (type) {
      if (!used.some(function (key) {
        return key == type;
      })) {
        used.push(type);
      }
    }
    else {
      used = [];
      for (var p in this.messages) {
        used.push(p);
      }
      this.used = used;
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
