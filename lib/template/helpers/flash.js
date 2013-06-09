var getDisplayClass
  , describe
  , getDisplayData;

/*
  @name getDisplayClass
  @private
  @function
  @description Get the CSS class of a particular type
  @param {String} [type] the type of flash message (e.g. 'success')
  @param {String} [type] the display mode (e.g. 'inline' or 'block')
  @returns {String} CSS class of a particular type, defaults to config.flashes.defaultClass if not found
*/
getDisplayClass = function (type, mode) {
  var config = geddy.config.flash;
  if (mode === "inline" && config.inlineClasses[type] != null) {
    return config.inlineClasses[type];
  }
  if (mode === "block" && config.blockClasses[type] != null) {
    return config.blockClasses[type];
  }
  return config.defaultClass;
};

/*
  @name #describe
  @private
  @function
  @description Humanizes a flash message and suggests a display mode
  @param {String} [message] the message object
  @returns {Object} Human-readable version of a message
      and the suggested display type (e.g. {text:"Welcome!", mode:"inline"})
*/
describe = function (message) {
  //null or undefined
  if (message == null) {
    return {
      text: "" + message,
      mode: "inline"
    };
  }
  //string messages
  else if (typeof message === "string") {
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
      if (message.hasOwnProperty(key)) {
        buffer += key.charAt(0).toUpperCase() + key.slice(1) + ": " + message[key] + ", ";
        count++;
      }
    }
    //Remove extra comma and space
    if (count>0) {
      buffer = buffer.substring(0, buffer.length - 2) + ".";
    }
    return {
      text: buffer,
      mode: "block"
    };
  }
};

getDisplayData = function (flash) {
  var messages = flash.messages
    , data = [];
  Object.keys(messages).forEach(function (k) {
    var message = messages[k]
      , described = describe(message);
    data.push({
      message: message
    , heading: k.charAt(0).toUpperCase() + k.slice(1)
    , description: described.text
    , isInline: described.mode === "inline"
    , isBlock: described.mode === "block"
    , displayClass: getDisplayClass(k, described.mode)
    });
  });
  return data;
};

exports.displayFlash = function (flash) {
  var markup = ''
    , flashes = getDisplayData(flash);
  markup += '<div id="flash-container">';
  for (var i = 0, ii = flashes.length; i < ii; i++) {
    markup += '<div class="' + flashes[i].displayClass + '">';
    markup += '<button type="button" class="close" data-dismiss="alert">&times;</button>';
    if (flashes[i].isInline) {
      markup += '<strong>' + flashes[i].heading + ':</strong>&nbsp;';
    }
    else {
      markup += '<h4>' + flashes[i].heading + '</h4>';
    }
    markup +=  flashes[i].description;
    markup += '</div>';
  }
  markup += '</div>';
  markup += '<script type="text/javascript">'
  markup += '$("#flash-container .alert").alert();'
  markup += '</script>';

  return markup;
};
