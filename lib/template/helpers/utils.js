var utils = require('utilities')
  // Include empty params so that conditionals will work without registerData being called
  , Data = {params: {}};

// Register Object for use with `exports.urls`, needs
// a `data.params` to be of any use
exports.registerData = function (data) { Data = utils.mixin({params: {}}, data); };

/*
 * Helper utilities for dealing with HTML tags, and other attributes
*/
exports.tags = {
  boolAttributes: [
    'disabled', 'readonly', 'multiple', 'checked',
    'autobuffer', 'autoplay', 'controls',
    'loop', 'selected', 'hidden', 'scoped',
    'async', 'defer', 'reversed', 'ismap', 'seemless',
    'muted', 'required', 'autofocus', 'novalidate',
    'open', 'pubdate', 'itemscope', 'formnovalidate'
  ],

  selfClosingTags: {
    'link': {name: 'link', content: 'href'},
    'meta': {name: 'meta', content: 'content'},
    'img': {name: 'img', content: 'src'},
    'input': {name: 'input', content: 'value'},
    'area': {name: 'area', content: 'href'},
    'base': {name: 'link', content: 'href'},
    'col': {name: 'col', content: 'title'},
    'frame': {name: 'frame', content: 'src'},
    'param': {name: 'param', content: 'value'}
  },

  preContentStrings: {
    textarea: '\n'
  },

  /*
   * contentTagString(tag<String>, content<String>, htmlOptions<Object>)
   *
   * Returns a HTML element created from the tag, content and
   * html attributes given
  */
  contentTagString: function (tag, content, htmlOptions) {
    if(!tag) {
      return;
    }
    if(!content) {
      content = '';
    }
    htmlOptions = htmlOptions || {};

    var selfClosing = (tag in this.selfClosingTags) ? this.selfClosingTags[tag] : undefined
      , tagOptions;

    if (selfClosing) {
      htmlOptions[selfClosing.content] = htmlOptions[selfClosing.content] || content || false;
    }
    if (tag === 'a') {
      htmlOptions.href = htmlOptions.href || content;
    }
    if (tag === 'img') {
      htmlOptions.alt = htmlOptions.alt === '' ? htmlOptions.alt : htmlOptions.alt || content;
    }
    if (tag === 'select' && typeof content !== 'string') {
      return this.selectTagString(content, null, htmlOptions);
    }

    tagOptions = this.tagOptions(htmlOptions);

    content = this.preContentStrings[tag] ?
      this.preContentStrings[tag] + content :
      content;

    if (selfClosing) {
      return '<'+tag+tagOptions+' />';
    } else {
      return '<'+tag+tagOptions+'>' + content + '</'+tag+'>';
    }
  },

  /*
   * selectTagString(optionsArray<Array>, selectedOption, htmlOptions<Object>)
   *
   * Creates a HTML select tag using the given `optionsArray` to create HTML option elements.
   */
  selectTagString: function (optionsArray, selectedOption, htmlOptions) {
    var optionTags = ''
      , text
      , value
      , attrs = {};

    for (var i = 0; i < optionsArray.length; i++) {
      if (typeof optionsArray[i] == 'object') {
        text = optionsArray[i].text;
        value = optionsArray[i].value;
        if (typeof optionsArray[i].attrs == 'object') {
          attrs = optionsArray[i].attrs;
        }
      }
      else {
        text = optionsArray[i];
        value = optionsArray[i];
      }
      attrs.value = value || attrs.value;
      attrs.selected = selectedOption ? (attrs.value == selectedOption) : attrs.selected;
      optionTags += this.contentTagString('option', text, attrs);
    }

    return this.contentTagString("select", optionTags, htmlOptions);
  },

  /*
   * tagOptions(options<Object>)
   *
   * Returns a string of parsed HTML options sorted alphabetically
  */
  tagOptions: function (options) {
    if(!options) {
      return;
    }

    var self = this
      , attrs = []
      , key
      , value
      , i, k;

    // Loop through each option
    for (i in options) {
      key = utils.string.dasherize(i);
      value = options[i];

      // If it's a data key that has an object
      // loop through each of the values in the object
      // and create data attributes out of them
      if (key === 'data' && typeof value === 'object') {
        for (k in value) {
          attrs.push(self.dataAttribute(k, value[k]));
        }
      }
      // If the attribute is a boolean attribute
      // parse it as a bool attribute
      else if (utils.array.included(key, self.boolAttributes)) {
        if (value) {
          attrs.push(self.boolAttribute(key));
        }
      }
      // Just a normal attribute, parse it normally
      else if (value || value === '') {
        attrs.push(self.tagAttribute(key, value))
      }
    }

    if (attrs.length > 0) {
      return ' ' + attrs.sort().join(' ');
    } else {
      return '';
    }
  },

  /*
   * dataAttribute(attribute<String>, value<String/Number/Array/Boolean>)
   *
   * Returns a parsed HTML data attribute
  */
  dataAttribute: function (attribute, value) {
    attribute = 'data-' + utils.string.dasherize(attribute);

    return this.tagAttribute(attribute, value);
  },

  /*
   * boolAttribute(attribute<String>)
   *
   * Returns a parsed HTML boolean attribute
  */
  boolAttribute: function (attribute) {
    return attribute + '="' + attribute + '"';
  },

  /*
   * tagAttribute(attribute<String>, value<String/Number/Array/Boolean>)
   *
   * Returns a parsed HTML attribute
  */
  tagAttribute: function (attribute, value) {
    // If value is an Array join them with a space
    if (typeof value === 'object' && value instanceof Array) {
      value = value.join(' ');
    }

    return attribute + '="' + value + '"';
  }
};

/*
 * Helper utilities for generating URLs based on a String or an Object
*/
exports.urls = {
  // List of protocols that use slashes
  slashedProtocols: [
    'aaa', 'aaas', 'acap', 'cap', 'crid', 'dict', 'dns', 'file', 'ftp', 'go', 'gopher',
    'http', 'https', 'imap', 'ldap', 'nfs', 'nntp', 'pop', 'rsync', 'snmp', 'telnet',
    'wais', 'z39.50r', 'z39.50s',
    // Unofficial but may be used
    'adiumxtra', 'afp', 'aw', 'beshare', 'bolo', 'chrome', 'coap', 'content', 'cvs',
    'ed2k', 'facetime', 'feed', 'finger', 'fish', 'git', 'gizmoproject', 'irc', 'ircs',
    'irc6', 'keyparc', 'lastfm', 'ldaps', 'market', 'message', 'mms', 'mumble', 'notes',
    'platform', 'psyc', 'rmi', 'rmtp', 'sgn', 'ssh', 'sftp', 'smb', 'soldat', 'steam', 'svn',
    'teamspeak', 'udp', 'unreal', 'ut2004', 'ventrilo', 'webcal', 'wtai', 'wyciwyg', 'xri'
  ],

  // List of supported options, used to check for queries
  supportedOptions: [
    'relPath', 'protocol', 'username', 'password', 'subdomain', 'domain', 'host', 'port', 'controller', 'id',
    'action', 'trailingSlash', 'fragment', 'anchor'
  ],

  escape: function (string) { return encodeURIComponent(string) },

  genProtocol: function (options) {
    // Generates a protocol from the options and defaults to the one used by Geddy currently
    options = options || {};
    var protocol = options.protocol;

    // Set default protocol if none is given
    if (geddy.config.ssl) {
      protocol = protocol || 'https';
    } else {
      protocol = protocol || 'http';
    }

    // Remove slashes, etc.
    protocol = protocol.replace(/:\/*/, '');
    protocol += ':';

    // If it's a slashed protocol then add slashes
    if (utils.array.included(protocol.replace(/:\/*/, ''), this.slashedProtocols)) {
      if (protocol.replace(/:\/*/, '') === 'file') {
        protocol += '///';
      } else {
        protocol += '//';
      }
    }

    return protocol;
  },

  genAuth: function (options) {
    // Returns a String containing the user and password in the format 'user:password@'
    if (options.username && options.password) {
      return this.escape(options.username) + ':' + this.escape(options.password) + '@';
    } else {
      return '';
    }
  },

  genHost: function (options) {
    options = options || {};
    var domain = options.domain
      , hostname = '';

    if (geddy.config.hostname) {
      domain = domain || geddy.config.hostname;
    }

    if (options.subdomain) {
      hostname += options.subdomain + '.';
    }
    hostname += domain;

    // Add port if one is given
    if (options.port) {
      hostname += ':' + options.port;
    }

    // Add slash if nothing else is being added to the url
    if (options.trailingSlash && !options.controller && !options.id && !options.action) {
      hostname += '/';
    }

    return hostname;
  },

  genPath: function (options) {
    options = options || {};
    var path = '';

    if (options.controller) {
      // Normalize controller name
      options.controller = utils.string.snakeize(options.controller);

      path += '/' + options.controller;

      if(!options.action && !options.id) {
        options.action = 'index';
      }
      if (options.action === 'index') {
        if (options.trailingSlash) {
          path += '/';
        }
        return path;
      }
    }
    if (options.id) {
      // If no controller is given attempt to get the current one
      if(!options.controller && Data.params.controller) {
        var controller = utils.string.decapitalize(Data.params.controller);

        options.controller = controller;
        path += '/' + controller;
      }
      path += '/' + options.id;

      if(!options.action) {
        options.action = 'show';
      }
      if (options.action === 'show') {
        if (options.trailingSlash) {
          path += '/';
        }
        return path;
      }
    }
    if (options.action) {
      path += '/';

      // If no controller is given attempt to get the current one
      if(!options.controller && Data.params.controller) {
        var controller = utils.string.decapitalize(Data.params.controller);;

        options.controller = controller;
        path += controller + '/';
      }

      if (options.action === 'show') {
        return options.trailingSlash ? path += '/' : path;
      } else {
        path += options.action;
        if (options.trailingSlash) {
          path += '/';
        }
      }
    }

    return path;
  },

  genQuery: function (options) {
    options = options || {};
    var query = ''
      , i;

    // Delete all other options
    i = this.supportedOptions.length;
    while (--i >= 0) {
      delete options[this.supportedOptions[i]];
    }

    if(!utils.object.isEmpty(options)) {
      options = utils.object.toArray(options);


      // Do positive while loop here to keep query items in order
      i = -1;
      while (++i < options.length) {
        query += i == 0 ? '?' : '&';
        query += this.escape(options[i].key) + '=' + this.escape(options[i].value);
      }
    } else {
      return query;
    }

    return query;
  },

  genFragment: function (options) {
    options = options || {};
    var fragment = '';

    if (options.fragment) {
      fragment += '#' + this.escape(options.fragment);
    }

    return fragment;
  },

  parseOptions: function (options) {
    options = options || {};

    // Set up alias's
    options.domain = options.domain || options.host;
    if (options.host) {
      // Delete it as it's not used
      delete options.host;
    }
    options.fragment = options.fragment || options.anchor;
    if (options.anchor) {
      // Delete it as it's not used
      delete options.anchor;
    }

    // If `host` option exists set `relPath` as false
    options = utils.object.merge({ relPath: !options.domain }, options);

    // If no `host` is available, and `relPath` is false then we have no idea who
    // the host is
    if(!options.domain && !options.relPath) {
      throw 'Missing `host` to create URL to! Please provide a `host` paremeter, or `relPath` to true.';
    }
    var protocol = ''
      , userinfo = ''
      , host = ''
      , path = ''
      , query = ''
      , fragment = '';

    // If we're getting the full path, then create the full URI scheme
    if(!options.relPath) {
      protocol += this.genProtocol(options);
      userinfo += this.genAuth(options);
      host += this.genHost(options);
    }
    path += this.genPath(options);
    fragment += this.genFragment(options);
    query += this.genQuery(options);

    return protocol + userinfo + host + path + query + fragment;
  },

  urlFor: function (options) {
    switch (typeof options) {
      case 'string':
        // If `back` then assume they want to go to the last URL
        if (options === 'back') {
          // Rails uses a request object called `HTTP_REFERER`
          // - with this JS fallback
          return 'javascript:history.back()';
        }
        return options;
        break;
      case 'undefined':
      case 'object':
        return this.parseOptions(options || {});
        break;
      default:
        break;
    }
  }
};
