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
  , handlebars = {};

handlebars.Template = function (params) {
  params = params || {};

  // Try to require Handlebars or error out
  file.requireLocal('handlebars');

  this.mode = null;
  this.truncate = false;
  this.templato = params.templato;
  this.afterLoaded = params.afterLoaded;
  this.source = '';
  this.markup = undefined;
  this.templateText = params.text;
};

handlebars.Template.prototype = new function () {

  this.process = function (params) {
    params = params || {}
    var domNode = params.node
      , settings;

    this.data = params;
    this.source = this.source || ''; // Cache generated template for speed

    // If no cache is available generate template
    if(!this.source) {
      settings = {
          engine: 'handlebars'
        , template: this.templateText
      };

      this.templato.set(settings);
      this.source = this.templato.render(this.data);
    }

    // Assign the source to the template markup
    this.markup = this.source;

    if (domNode) {
      domNode.innerHTML = this.markup;
    }

    return this.markup;
  };

};

exports.Template = handlebars.Template;
