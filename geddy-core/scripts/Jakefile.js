/*
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

var sys = require('sys');
var child_process = require('child_process');
var fs = require('fs');

exports.tasks = {
  'default': {
    'desc': 'Installs the Geddy Web-app development framework'
    , 'deps': []
    , 'task': function () {
      var uid = process.env.SUDO_UID;
      var gid = process.env.SUDO_GID;
      var cmds = [
        'mkdir -p ~/.node_libraries',
        'cp -R ./dist/* ~/.node_libraries/',
        'chown -R ' + uid + ':' + gid + ' ~/.node_libraries',
        'cp geddy-core/scripts/geddy-gen /usr/local/bin/',
        'cp geddy-core/scripts/geddy /usr/local/bin/'
      ];
      runCmds(cmds, function () {
        sys.puts('Geddy installed.');
      });
    }
  }

  , 'app': {
    'desc': 'Creates a new Geddy app scaffold.'
    , 'deps': []
    , 'task': function (appName) {
      var dir = appName;
      var cmds = [
        'mkdir -p ./' + dir,
        'mkdir -p ./' + dir + '/config',
        'mkdir -p ./' + dir + '/app/models',
        'mkdir -p ./' + dir + '/app/controllers',
        'mkdir -p ./' + dir + '/app/views',
        'mkdir -p ./' + dir + '/public',
        'mkdir -p ./' + dir + '/lib',
        'cp ~/.node_libraries/geddy-core/scripts/gen/router.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/config.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/inflections.js ' + dir + '/config/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/main.js ' + dir + '/app/controllers/',
        'cp ~/.node_libraries/geddy-core/scripts/gen/application.js ' + dir + '/app/controllers/'
      ]
      runCmds(cmds, function () {
        sys.puts('Created app ' + dir + '.');
      });
    }
  }
  
  , 'resource': {
    'desc': ''
    , 'deps': []
    , 'task': function (nameParam) {
      var util = {};
      var text, contents;
      var filePath;
      var fleegix = require('../lib/fleegix');
      util.string = require('../../geddy-util/lib/string');
      
      // Add the controller file
      // ----
      var n = nameParam.split(',');
      var names = {filename: {}, constructor: {}, property: {}};
      names.filename.singular = n[0];
      // TODO: No fancy inflections yet
      names.filename.plural = n[1] || names.filename.singular + 's';
      
      // Convert underscores to camelCase, e.g., 'neilPeart'
      names.property.singular = util.string.camelize(names.filename.singular, false);
      names.property.plural = util.string.camelize(names.filename.plural, false);
      // Convert underscores to camelCase with init cap, e.g., 'NeilPeart'
      names.constructor.singular = util.string.camelize(names.filename.singular, true);
      names.constructor.plural = util.string.camelize(names.filename.plural, true);
      
      // Model
      // ----
      // Grab the template text
      text = fs.readFileSync(__dirname + '/gen/resource_model.ejs', 'utf8');
      // Stick in the model name
      var templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      filePath = './app/models/' + names.filename.singular + '.js';
      fs.writeFileSync(filePath, templ.markup, 'utf8');
      sys.puts('[ADDED] ' + filePath);

      // Controller
      // ----
      // Grab the template text
      text = fs.readFileSync(__dirname + '/gen/resource_controller.ejs', 'utf8');
      // Stick in the controller name
      var templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      filePath = './app/controllers/' + names.filename.plural + '.js';
      fs.writeFileSync(filePath, templ.markup, 'utf8');
      sys.puts('[ADDED] ' + filePath);

      // Add the route
      // ----
      // Grab the config text
      filePath = './config/router.js';
      text = fs.readFileSync(filePath, 'utf8');
      // Add the new resource route just above the export
      routerArr = text.split('exports.router');
      routerArr[0] += 'router.resource(\'' +  names.filename.plural + '\');\n';
      text = routerArr.join('exports.router');
      fs.writeFileSync(filePath, text, 'utf8');
      sys.puts('resources ' + names.filename.plural + ' route added to ' + filePath);

      // Add inflections map
      // ----
      var canon = names.constructor.singular;
      contents = fs.readFileSync('./config/inflections.js', 'utf8');
      var last = 'for (var p in inflections) { exports[p] = inflections[p]; }';
      contents = contents.replace(last, '');
      text = '';
      text += 'var ' + canon + ' = ' + JSON.stringify(names) + ';\n';
      text += "inflections['" + names.filename.singular + "'] = " + canon + ";\n"
      text += "inflections['" + names.filename.plural + "'] = " + canon + ";\n"
      text += "inflections['" + names.constructor.singular + "'] = " + canon + ";\n"
      text += "inflections['" + names.constructor.plural + "'] = " + canon + ";\n"
      text += "inflections['" + names.property.singular + "'] = " + canon + ";\n"
      text += "inflections['" + names.property.plural + "'] = " + canon + ";\n"
      contents += text;
      contents += last;
      fs.writeFileSync('./config/inflections.js', contents, 'utf8');
      sys.puts('Updated inflections map.');
      
      var cmds = [
        'mkdir -p ./app/views/' + names.filename.plural,
        'cp ~/.node_libraries/geddy-core/scripts/gen/views/* ' + './app/views/' + names.filename.plural + '/'
      ]
      runCmds(cmds, function () {
        sys.puts('Created view templates.');
      });
    }
  }

  , 'scaffold': {
    'desc': 'Creates a scaffold for CRUD operations on a resource.'
    , 'deps': []
    , 'task': function (nameParam) {
      var def, props, prop, modelKey, modelDirName, fileName;
      var text = '';
      // Set up a minimal environment for intepreting the model
      GLOBAL.util = {};
      GLOBAL.util.meta = require('geddy-util/lib/meta');
      GLOBAL.util.string = require('geddy-util/lib/string');
      GLOBAL.util.date = require('geddy-util/lib/date');
      GLOBAL.config = {dirname: process.cwd()};
      GLOBAL.inflections = require(config.dirname + '/config/inflections');
      var model = require('geddy-model/lib/model');
      var fleegix = require('../lib/fleegix');

      fs.readdir('./app/models', function (err, res) {

        var names = inflections[nameParam]; 
        modelKey = names.constructor.singular;
        modelDirName = names.filename.plural;
        
        model.registerModels(err, res);
        def = model.modelRegistry[modelKey];
        props = def.properties;
        text += '<form method="post" action="<%= params.formAction %>">\n';
        for (p in props) {
          if (p == 'createdAt' || p == 'updatedAt') {
            continue;
          }
          prop = props[p];
          text += '<div>' + util.string.capitalize(p);
          switch (prop.datatype.toLowerCase()) {
            case 'string':
              text += '</div>\n'
              text += '<div><input type="text" id="' + p + '" name="' + p +
                  '" value="<%= params.' + p + ' || \'\' %>" size="24"/></div>\n';
              break;
            case 'date':
              text += '</div>\n'
              text += '<div><input type="text" id="' + p + '" name="' + p +
                  '" value="<%= util.date.strftime(params.' + p +
                  ', config.dateFormat) || \'\' %>" size="24"/></div>\n';
              break;
            case 'number':
            case 'int':
              text += '</div>\n'
              text += '<div><input type="text" id="' + p + '" name="' + p +
                  '" value="<%= params.' + p + ' || \'\' %>" size="8"/></div>\n';
              break;
            case 'boolean':
              text += '&nbsp;<input type="checkbox" id="' + p + '" name="' + p +
                  '" value="true" <%= if (params.' + p + ') { \'checked\'; }  %>/></div>\n';
              break;
          }
        }
        text += '<input type="submit" value="Submit"/>\n'
        text += '</form>\n'
        
        fileName = config.dirname + '/app/views/' +
            modelDirName + '/_form.html.ejs';
        fs.writeFileSync(fileName, text, 'utf8');

        text = fs.readFileSync(__dirname + '/gen/views/add_scaffold.html.ejs', 'utf8');
        fileName = config.dirname + '/app/views/' +
            modelDirName + '/add.html.ejs';
        fs.writeFileSync(fileName, text, 'utf8');

        text = fs.readFileSync(__dirname + '/gen/views/edit_scaffold.html.ejs', 'utf8');
        fileName = config.dirname + '/app/views/' +
            modelDirName + '/edit.html.ejs';
        fs.writeFileSync(fileName, text, 'utf8');

        text = fs.readFileSync(__dirname + '/gen/views/index_scaffold.html.ejs');
        text = text.replace(/###controller###/g, modelDirName);
        fileName = config.dirname + '/app/views/' +
            modelDirName + '/index.html.ejs';
        fs.writeFileSync(fileName, text, 'utf8');

        // Scaffold version of Controller
        // ----
        // Grab the template text
        text = fs.readFileSync(__dirname + '/gen/resource_controller_scaffold.ejs', 'utf8');
        // Stick in the controller name
        var templ = new fleegix.ejs.Template({text: text});
        templ.process({data: {names: names}});
        filePath = './app/controllers/' + names.filename.plural + '.js';
        fs.writeFileSync(filePath, templ.markup, 'utf8');
        
        sys.puts('Created controller and views for ' + nameParam + '.');
      });
    }
  }

};

// Runs an array of shell commands asynchronously, calling the
// next command off the queue inside the callback from child_process.exec.
// When the queue is done, call the final callback function.

var runCmds = function (arr, callback) {
  var run = function (cmd) {
    child_process.exec(cmd, function (err, stdout, stderr) {
      if (err) {
        sys.puts('Error: ' + JSON.stringify(err));
      }
      else if (stderr) {
        sys.puts('Error: ' + stderr);
      }
      else {
        if (arr.length) {
          var next = arr.shift();
          run(next);
        }
        else {
          callback();
        }
      }
    });
  };
  run(arr.shift());
};

