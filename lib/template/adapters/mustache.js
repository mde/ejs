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

var file = require('utilities').file
  , mustache = {};

mustache.Template = function(params) {
  params = params || {};

  // Try to require Jade or error out
  file.dependency('handlebars', [
      "To use Handlebars you will need to install it: [sudo] npm install [-g] handlebars"
    , ""
    , "Mustache, Handlebars same thing, so we're installing Handlebars. http://is.gd/kYTJyS"
  ].join('\n'));

  this.mode = null;
  this.truncate = false;
  this.templato = params.templato;
  this.afterLoaded = params.afterLoaded;
  this.source = '';
  this.markup = undefined;
  this.templateText = params.text;
};

mustache.Template.prototype = new function() {

  this.process = function(params) {
    params = params || {}
    var domNode = params.node
      , settings;

    this.data = params;
    this.source = this.source || ''; // Cache generated template for speed

    // If no cache is available generate template
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

};

exports.Template = mustache.Template;
