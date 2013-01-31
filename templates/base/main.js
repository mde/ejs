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

var Main = function () {
  this.index = function (req, resp, params) {
    // If using SWIG as your templating engine, you'll need to pass a couple extra options...
    // Pass the 'layout' parameter to the view.  This is used in the SWIG view to define which layout file to use
    this.respond({params: params, layout: process.cwd() + '/app/views/layouts/layout.swig'}, {
      format: 'html'
    , template: 'app/views/main/index'
    , layout: false // Tells geddy to use it's 'empty' layout.  This allows us to define our layout files within each swig partial view
    });

    // Non-swig example
    /*
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/index'
    });
    */
  };
};

exports.Main = Main;


