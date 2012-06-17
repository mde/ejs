/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var errors = require('../../response/errors')
  , jade = {};

jade.Template = function(params) {
  params = params || {};

  // Try to require Jade or error out
  try {
    // Note: This isn't actually used here
    // - mainly it's here so we can use geddy errors to error out with
    require('handlebars');
  } catch(err) {
    throw [
        "To use Handlebars you will need to install it: [sudo] npm install [-g] handlebars"
      , ""
      , "Note:".red+" We are using Handlebars in place of Mustache because it's faster and offers"
      , "      many other features."
    ].join('\n');
  }

  this.mode = null;
  this.truncate = false;
  this.templato = params.templato;
  this.afterLoaded = params.afterLoaded;
  this.source = '';
  this.markup = undefined;
  // Note: If you don't want to use Fleegix.js,
  // override getTemplateTextFromNode to use
  // textarea node value for template text
  this.templateText = params.text || this.getTemplateTextFromNode(params.node);

  // Try to get from URL if no template text
  if(typeof this.templateText == 'undefined') {
    // If you don't want to use Fleegix.js,
    // override getTemplateTextFromUrl to use
    // files for template text
    this.getTemplateTextFromUrl(params);
  }
};

jade.Template.prototype = new function() {

  this.getTemplateTextFromNode = function(node) {
    // Requires the fleegix.xhr module
    if(typeof fleegix.string == 'undefined') throw 'Requires fleegix.string module.';
    var ret;

    if(node) {
      ret = node.value;
      ret = fleegix.string.unescapeXML(ret);
      ret = fleegix.string.trim(ret);
    }
    return ret;
  };

  this.getTemplateTextFromUrl = function(params) {
    // Requires the fleegix.xhr module
    if (typeof fleegix.xhr == 'undefined') throw 'Requires fleegix.xhr module.';
    var self = this
      , url = params.url
      , noCache = params.preventCache || false;

    // If cache is found and caching is on
    if (text && !noCache) {
      this.templateText = text;
    }
    // Otherwise get the text
    else {
      var opts;
      var callback = function(s) {
        // Callback for setting templateText and caching
        // - used for both sync and async loading
        self.templateText = s;
        ejs.templateTextCache[url] = s;

        // Use afterLoaded hook if set
        if (typeof self.afterLoaded == 'function') {
          self.afterLoaded();
        }
      };

      if(params.async) {
        opts = {
            url: url
          , method: 'GET'
          , preventCache: noCache
          , async: true
          , handleSuccess: callback
        };
        // Get template text asynchronously, wait for
        // loading to exec the callback
        fleegix.xhr.send(opts);
      }
      else {
        opts = {
            url: url
          , method: 'GET'
          , preventCache: noCache
          , async: false
        };
        // Get the template text inline and pass directly to
        // the callback
        text = fleegix.xhr.send(opts);
        callback(text);
      }
    }
  };

  this.process = function(params) {
    params = params || {}
    var domNode = params.node
      , settings;

    this.data = params;
    this.source = this.source || ''; // Cache generated template for speed

    // If no cache is available generate template
    //if(!this.source) this.source = this.generateSource();
    if(!this.source) {
      settings = {
          engine: 'mustache'
        , template: this.templateText
      };

      this.templato.set(settings);
      this.source = this.templato.render(this.data);
    }

    // Assign the source to the template markup
    this.markup = this.source;

    if(domNode) domNode.innerHTML = this.markup;

    return this.markup;
  };

  /*this.generateSource = function() {
    var str = this.templateText
      , template
      , options = {cache: true, filename: this.data.template.file};

    this.engine.render(str, options, function(err, data) {
      if(err) throw err;
      template = data;
    });

    return template;
  };*/

};

exports.Template = jade.Template;
