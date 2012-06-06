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

var utils = require('../../utils')
  , errors = require('../../response/errors')
  , jade = {};

jade.Template = function(params) {
  var UNDEF;
  var params = params || {};

  this.mode = null;
  this.truncate = false;
  // Note: If you don't want to use Fleegix.js,
  // override getTemplateTextFromNode to use
  // textarea node value for template text
  this.templateText = params.text || this.getTemplateTextFromNode(params.node);
  this.afterLoaded = params.afterLoaded;
  this.source = '';
  this.markup = UNDEF;

  // Try to get from URL if no template text
  if (typeof this.templateText == 'undefined') {
    // If you don't want to use Fleegix.js,
    // override getTemplateTextFromUrl to use
    // files for template text
    this.getTemplateTextFromUrl(params);
  }
};

jade.Template.prototype = new function() {

  this.getTemplateTextFromNode = function(node) {
    // Requires the fleegix.xhr module
    if (typeof fleegix.string == 'undefined') {
      throw 'Requires fleegix.string module.';
    }
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
    if (typeof fleegix.xhr == 'undefined') {
      throw 'Requires fleegix.xhr module.';
    }
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
    var params = params || {}
      , domNode = params.node
      , _output;

    this.data = params.data || {};
    this.source = this.source || ''; // Cache generated template for speed

    // If no cache is available generate template
    if(!this.source) this.source = this.generateSource();

    // Assign the source to the template markup
    this.markup = this.source;

    if (domNode) domNode.innerHTML = this.markup;

    return this.markup;
  };

  this.generateSource = function() {
    try {
      this.engine = this.engine || require('jade');
    } catch(err) {
      new errors.viewError('jade');
    }
    var str = this.templateText
      , template
      , options = {cache: true, filename: this.data.template.file};

    // TODO:
    // The way our EJS engine is working won't work for other engines,
    // it splits the layout and template into two different template rendering sections
    // - (template then layout) so it injects the template into the layout and
    // renders that output.
    // Jade has it's own injection solution through blocks and extends,
    // so I need to find a way to keep it in one set(Not sending the layout and template in different sequences)
    // or something else..

    // Also for Jade when using extends it gets the extends path, then appends .jade to it,
    // but out generated files user .html.jade so I think we'll have to remove that, or
    // try to inject .html to the end of the extends statement

    // When consoling the output for 'data' below, it does render the template correctly(Including layout)
    // But not exactly sure if it'll include needed data and other things, still
    // trying to see if rendering will work correctly
    this.engine.render(str, options, function(err, data) {
      // We shouldn't throw I don't think, but it'll work for now while developing
      if(err) throw err;
      template = data;
    });

    return template;
  };

};

exports.Template = jade.Template;
