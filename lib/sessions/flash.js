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
    
    this.copyMessagesForTemplates();
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
    if(type) {
      if(this.messages[type]) {
        return this.messages[type].message;
      }
      else {
        return this.messages[type];
      }
    }
    else {
      //Strip out the display classes to match the Rails API
      var output = {};
      for(var key in this.messages) {
        if(this.messages.hasOwnProperty(key)) {
          output[key] = this.messages[key].message;
        }
      }
      return output;
    }
  };

  /*
    @name Flash#getDisplayClass
    @public
    @function
    @description Get the CSS class of a particular type
    @param {String} [type] the type of flash message (e.g. 'success')
    @param {String} [type] the display mode (e.g. 'inline' or 'block')
    @returns {String} CSS class of a particular type, defaults to config.flashes.defaultClass if not found
  */
  this.getDisplayClass = function (type, mode) {
    if(mode === "inline" && this.config.inlineClasses[type] != null) {
      return this.config.inlineClasses[type];
    }
    if(mode === "block" && this.config.blockClasses[type] != null) {
      return this.config.blockClasses[type];
    }
    return this.config.defaultClass;
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
    
    //If setting a single type
    if (arguments.length > 1) {
      type = arguments[0];
      message = arguments[1];
      //Find and store the CSS class for this flash type
      this.messages[type] = {
        message: message
      , heading: type.charAt(0).toUpperCase() + type.slice(1)
      };
      //Determine description text and display modes
      var described = this.describe(message);
      this.messages[type].description = described.text;
      this.messages[type].isInline = described.mode === "inline";
      this.messages[type].isBlock = described.mode === "block";
      //Determine the display class
      this.messages[type].displayClass = this.getDisplayClass(type, described.mode);
    }
    //If setting the entire messages object
    //Iterate through and find the CSS classes
    else {
      message = arguments[0];
      this.messages = [];
      for(var key in message) {
        if(message.hasOwnProperty(key)) {
          this.set(key, message[key]);
        }
      }
    }
    
    this.copyMessagesForTemplates();
  };

  /*
    @name Flash#describe
    @private
    @function
    @description Humanizes a flash message and suggests a display mode
    @param {String} [message] the message object
    @returns {Object} Human-readable version of a message and the suggested display type (e.g. {text:"Welcome!", mode:"inline"})
  */
  this.describe = function (message) {
    //null or undefined
    if(message == null) {
      return {
        text: "" + message,
        mode: "inline"
      };
    }
    //string messages
    else if(typeof message === "string") {
      return {
        text: message,
        mode: "inline"
      };
    }
    //error objects etc
    else {
      var buffer = "";
      var count = 0;
      for(var key in message) {
        if(message.hasOwnProperty(key)) {
          buffer += key.charAt(0).toUpperCase() + key.slice(1) + ": " + message[key] + ", ";
          count++;
        }
      }
      //Remove extra comma and space
      if(count>0) {
        buffer = buffer.substring(0, buffer.length - 2) + ".";
      }
      return {
        text: buffer,
        mode: "block"
      };
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
  
  this.copyMessagesForTemplates = function() {
    this.messagesArr = [];
    for(var type in this.messages) {
      this.messagesArr.push(this.messages[type]);
    }
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
