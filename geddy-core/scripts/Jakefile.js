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

desc('Installs Geddy web framework');
task('default', [], function () {
  var uid = process.env.SUDO_UID;
  var gid = process.env.SUDO_GID;
  var cmds = [];
  cmds = [
    'mkdir -p ~/.node_libraries'
    , 'chown -R ' + uid + ':' + gid + ' ~/.node_libraries'
    , 'cp geddy-core/scripts/geddy-gen /usr/local/bin/'
    , 'cp geddy-core/scripts/geddy /usr/local/bin/'
  ];
  runCmds(cmds, function () {
    // TODO set uid/gid to non-superuser
    // Not entirely sure why this expands correctly to the non-superuser's
    // home dir, but I'm glad it does.
    cmds = [
      'cp -R ./dist/* ~/.node_libraries/'
    ];
    runCmds(cmds, function () {
      sys.puts('Geddy installed.');
    });
  });
});

desc('Uninstalls Geddy web framework');
task('uninstall', [], function () {
  var uid = process.env.SUDO_UID;
  var gid = process.env.SUDO_GID;
  var cmds = [];
  cmds = [
    'rm -f /usr/local/bin/geddy*'
  ];
  runCmds(cmds, function () {
    // TODO set uid/gid to non-superuser
    // Not entirely sure why this expands correctly to the non-superuser's
    // home dir, but I'm glad it does.
    cmds = [
      'rm -fr ~/.node_libraries/geddy*'
    ];
    runCmds(cmds, function () {
      sys.puts('Geddy uninstalled.');
    });
  });
});

desc('Creates a new Geddy app scaffold.');
task('app', [], function (appName) {
  var dir = appName,
      cmds = [
    'mkdir -p ./' + dir
    , 'mkdir -p ./' + dir + '/config'
    , 'mkdir -p ./' + dir + '/config/environments'
    , 'mkdir -p ./' + dir + '/app/models'
    , 'mkdir -p ./' + dir + '/app/controllers'
    , 'mkdir -p ./' + dir + '/app/views'
    , 'mkdir -p ./' + dir + '/public'
    , 'mkdir -p ./' + dir + '/public/js'
    , 'mkdir -p ./' + dir + '/public/css'
    , 'mkdir -p ./' + dir + '/lib'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/router.js ' + dir + '/config/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/init.js ' + dir + '/config/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/development.js ' + dir + '/config/environments/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/production.js ' + dir + '/config/environments/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/inflections.js ' + dir + '/config/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/main.js ' + dir + '/app/controllers/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/application.js ' + dir + '/app/controllers/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/master.css ' + dir + '/public/css/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/favicon.ico ' + dir + '/public/'
  ];
  runCmds(cmds, function () {
    sys.puts('Created app ' + dir + '.');
  });
});

// TODO: Refactor to modularize redundant code with controller task
desc('');
task('resource', [], function (nameParam) {
  var util = {};
  var text, contents;
  var filePath;
  var fleegix = require('../lib/fleegix');
  var ejs = require('../../geddy-template/lib/adapters/ejs/ejs');
  global.geddy = require('../../geddy-core/lib/geddy');

  // Add the controller file
  // ----
  var n = nameParam.split(',');
  var names = {filename: {}, constructor: {}, property: {}};
  names.filename.singular = n[0];
  // TODO: No fancy inflections yet
  names.filename.plural = n[1] || names.filename.singular + 's';

  // Convert underscores to camelCase, e.g., 'neilPeart'
  names.property.singular = geddy.util.string.camelize(names.filename.singular, false);
  names.property.plural = geddy.util.string.camelize(names.filename.plural, false);
  // Convert underscores to camelCase with init cap, e.g., 'NeilPeart'
  names.constructor.singular = geddy.util.string.camelize(names.filename.singular, true);
  names.constructor.plural = geddy.util.string.camelize(names.filename.plural, true);

  // Model
  // ----
  // Grab the template text
  text = fs.readFileSync(__dirname + '/gen/resource_model.ejs', 'utf8').toString();
  // Stick in the model name
  var templ = new ejs.Template({text: text});
  templ.process({data: {names: names}});
  filePath = './app/models/' + names.filename.singular + '.js';
  fs.writeFileSync(filePath, templ.markup, 'utf8');
  sys.puts('[ADDED] ' + filePath);

  // Controller
  // ----
  // Grab the template text
  text = fs.readFileSync(__dirname + '/gen/resource_controller.ejs', 'utf8').toString();
  // Stick in the controller name
  var templ = new ejs.Template({text: text});
  templ.process({data: {names: names}});
  filePath = './app/controllers/' + names.filename.plural + '.js';
  fs.writeFileSync(filePath, templ.markup, 'utf8');
  sys.puts('[ADDED] ' + filePath);

  // Add the route
  // ----
  // Grab the config text
  filePath = './config/router.js';
  text = fs.readFileSync(filePath, 'utf8').toString();
  // Add the new resource route just above the export
  routerArr = text.split('exports.router');
  routerArr[0] += 'router.resource(\'' +  names.filename.plural + '\');\n';
  text = routerArr.join('exports.router');
  fs.writeFileSync(filePath, text, 'utf8');
  sys.puts('resources ' + names.filename.plural + ' route added to ' + filePath);

  // Add inflections map
  // ----
  var canon = names.constructor.singular;
  contents = fs.readFileSync('./config/inflections.js', 'utf8').toString();
  var last = 'module.exports = inflections;';
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
    'mkdir -p ./app/views/' + names.filename.plural
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/views/add.html.ejs ' +
        './app/views/' + names.filename.plural + '/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/views/edit.html.ejs ' +
        './app/views/' + names.filename.plural + '/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/views/index.html.ejs ' +
        './app/views/' + names.filename.plural + '/'
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/views/show.html.ejs ' +
        './app/views/' + names.filename.plural + '/'
  ]
  runCmds(cmds, function () {
    sys.puts('Created view templates.');
  });
});

// TODO: Refactor to modularize redundant code with resource task
desc('');
task('controller', [], function (nameParam) {
  var util = {};
  var text, contents;
  var filePath;
  var fleegix = require('../lib/fleegix');

  global.geddy = require('../../geddy-core/lib/geddy');

  // Add the controller file
  // ----
  var n = nameParam.split(',');
  var names = {filename: {}, constructor: {}, property: {}};
  names.filename.singular = n[0];
  // TODO: No fancy inflections yet
  names.filename.plural = n[1] || names.filename.singular + 's';

  // Convert underscores to camelCase, e.g., 'neilPeart'
  names.property.singular = geddy.util.string.camelize(names.filename.singular, false);
  names.property.plural = geddy.util.string.camelize(names.filename.plural, false);
  // Convert underscores to camelCase with init cap, e.g., 'NeilPeart'
  names.constructor.singular = geddy.util.string.camelize(names.filename.singular, true);
  names.constructor.plural = geddy.util.string.camelize(names.filename.plural, true);

  // Controller
  // ----
  // Grab the template text
  text = fs.readFileSync(__dirname + '/gen/bare_controller.ejs', 'utf8').toString();
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
  text = fs.readFileSync(filePath, 'utf8').toString();
  // Add the new bare route just above the export
  routerArr = text.split('exports.router');
  routerArr[0] += 'router.match(\'/' +  names.filename.plural +
      '\').to({controller: \'' + names.constructor.plural + '\', action: \'index\'});\n';
  text = routerArr.join('exports.router');
  fs.writeFileSync(filePath, text, 'utf8');
  sys.puts('bare ' + names.filename.plural + ' route added to ' + filePath);

  // Add inflections map
  // ----
  var canon = names.constructor.singular;
  contents = fs.readFileSync('./config/inflections.js', 'utf8').toString();
  var last = 'module.exports = inflections;';
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
    'mkdir -p ./app/views/' + names.filename.plural
    , 'cp ~/.node_libraries/geddy-core/scripts/gen/views/index.html.ejs ' +
        './app/views/' + names.filename.plural + '/'
  ]
  runCmds(cmds, function () {
    sys.puts('Created view templates.');
  });
});


desc('Creates a scaffold for CRUD operations on a resource.');
task('scaffold', [], function (nameParam) {

  // Does the work of creating the scaffold -- runs after creating
  // the client-side model JS files
  var createScaffold = function () {
    var def, props, prop, modelKey, viewsDirName, fileName, tmpl, text;
    // Where the hell are we?
    var dirname = process.cwd();
    // FIXME: Port fleegix.js templates to geddy-util
    var fleegix = require('../lib/fleegix');

    // Set up a minimal environment for intepreting the model
    global.geddy = require('geddy-core/lib/geddy');

    geddy.config = {dirname: dirname};
    geddy.inflections = require(dirname + '/config/inflections');
    geddy.model = require('geddy-model/lib/model');

    fs.readdir(dirname + '/app/models', function (err, res) {

      var names = geddy.inflections[nameParam];
      modelKey = names.constructor.singular;
      modelFileName = names.filename.singular;
      viewsDirName = names.filename.plural;

      // Load up the model definition
      geddy.model.registerModels(err, res);
      def = geddy.model.modelRegistry[modelKey];
      props = def.properties;

      // Client-side file for client-side validation
      text = fs.readFileSync(dirname + '/app/models/' + modelFileName + '.js', 'utf8').toString();
      // Use client-side registration instead of server-side export
      text = text.replace('exports.' + modelKey + ' = ' + modelKey + ';',
          'geddy.model.registerModel(\'' + modelKey + '\');');
      fileName = dirname + '/public/js/models/' + modelFileName + '.js';
      fs.writeFileSync(fileName, text, 'utf8');
      sys.puts('Created client-side model JavaScript files.');

      text = '<form id="modelItemForm" method="post" action="<%= params.formAction %>"' +
          ' onsubmit="validateSubmit(); return false;">\n';
      for (p in props) {
        // Ignore timestamp fields -- they are owned by the system
        if (p == 'createdAt' || p == 'updatedAt') {
          continue;
        }
        prop = props[p];
        text += '<div>' + geddy.util.string.capitalize(p);
        switch (prop.datatype.toLowerCase()) {
          case 'string':
            var inputType = (p.toLowerCase().indexOf('password') > -1) ? 'password' : 'text';
            text += '</div>\n'

            text += '<div><input type="' + inputType + '" id="' + p + '" name="' + p +
                '" value="<%= params.' + p + ' || \'\' %>" size="24"/></div>\n';
            break;
          case 'date':
            text += '</div>\n'
            text += '<div><input type="text" id="' + p + '" name="' + p +
                '" value="<%= geddy.util.date.strftime(params.' + p +
                ', geddy.config.dateFormat) || \'\' %>" size="24"/></div>\n';
            break;
          case 'time':
            text += '</div>\n'
            text += '<div><input type="text" id="' + p + '" name="' + p +
                '" value="<%= geddy.util.date.strftime(params.' + p +
                ', geddy.config.timeFormat) || \'\' %>" size="12"/></div>\n';
            break;
          case 'number':
          case 'int':
            text += '</div>\n'
            text += '<div><input type="text" id="' + p + '" name="' + p +
                '" value="<%= params.' + p + ' || \'\' %>" size="8"/></div>\n';
            break;
          case 'boolean':
            text += '&nbsp;<input type="checkbox" id="' + p + '" name="' + p +
                '" value="true" <% var checked = (params.' + p + ') ? \'checked\' : \'\';  %><%= checked %>/></div>\n';
            break;
        }
      }
      text += '<input type="submit" value="Submit"/>\n'
      text += '</form>\n'

      fileName = dirname + '/app/views/' +
          viewsDirName + '/_form.html.ejs';
      fs.writeFileSync(fileName, text, 'utf8');

      text = fs.readFileSync(__dirname + '/gen/views/add_scaffold.html.ejs').toString();
      templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      text = templ.markup.replace(/<@/g, '<%').replace(/@>/g, '%>');
      fileName = dirname + '/app/views/' +
          viewsDirName + '/add.html.ejs';
      fs.writeFileSync(fileName, text, 'utf8');

      text = fs.readFileSync(__dirname + '/gen/views/edit_scaffold.html.ejs').toString();
      templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      text = templ.markup.replace(/<@/g, '<%').replace(/@>/g, '%>');
      fileName = dirname + '/app/views/' +
          viewsDirName + '/edit.html.ejs';
      fs.writeFileSync(fileName, text, 'utf8');

      text = fs.readFileSync(__dirname + '/gen/views/index_scaffold.html.ejs').toString();
      templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      text = templ.markup.replace(/<@/g, '<%').replace(/@>/g, '%>');
      fileName = dirname + '/app/views/' +
          viewsDirName + '/index.html.ejs';
      fs.writeFileSync(fileName, text, 'utf8');

      // Scaffold version of Controller
      // ----
      // Grab the template text
      text = fs.readFileSync(__dirname + '/gen/resource_controller_scaffold.ejs', 'utf8').toString();
      // Stick in the controller name
      templ = new fleegix.ejs.Template({text: text});
      templ.process({data: {names: names}});
      filePath = './app/controllers/' + names.filename.plural + '.js';
      fs.writeFileSync(filePath, templ.markup, 'utf8');

      sys.puts('Created controller and views for ' + nameParam + '.');
    });
  };

  // Create the client-side model files, then do the scaffold setup
  var cmds = [
    'mkdir -p ./public/js/models'
    , 'cp ~/.node_libraries/geddy-model/lib/model.js ./public/js/models/'
    , 'mkdir -p ./public/js/util'
    , 'cp ~/.node_libraries/geddy-util/lib/* ./public/js/util/'
  ]
  runCmds(cmds, function () {
    createScaffold();
  });

});

desc('Runs all tests in */tests/.');
task('test', [], function () {
  var paths, cmds = [];
  child_process.exec("find . | grep -v dist | grep '/tests/' | grep '\.js$'", function(err, stdout, stderr){
    paths = stdout.split('\n')
    paths.pop();
    for (var i = 0; i < paths.length; i++) {
      cmds.push('node ' + paths[i]);
    }
    runCmds(cmds, null, true);
  });
});

desc('Concats and minifies JS source files for client-side use.');
task('client', [], function (opts) {
  var jsmin, dirname, target, text, filename, path, minText;
  dirname = opts.dirname || process.cwd();
  target = opts.target || '.';
  text = '', minText = '';
  jsmin = require(dirname + '/geddy-core/scripts/fulljsmin').jsmin;
  text = fs.readFileSync(dirname + '/geddy-model/lib/model.js', 'utf8').toString();
  minText += jsmin('', text, 2);
  path = dirname + '/geddy-util/lib';
  fs.readdir(path, function (err, res) {
    if (err) { throw(err); }
    for (var i = 0, ii = res.length; i < ii; i++) {
      filename = res[i];
      text = fs.readFileSync(path + '/' + filename, 'utf8').toString();
      minText += jsmin('', text, 2);
    }
    fs.writeFileSync(target + '/geddy.js', minText, 'utf8')
    sys.puts('Built ' + target + '/geddy.js');
  });
});

namespace('db', function () {

  desc('Creates data repositories to be used with a Geddy app.');
  task('create', [], function () {
    fs.readdir('./config/environments', function (err, res) {
      var appConfig;
      var dirname = process.cwd();
      var filename;
      var dbConfig;
      var cmds;
      var jsPat = /\.js$/;
      var createStatement = 'CREATE TABlE geddy_data (uuid VARCHAR(255), ' +
          'type VARCHAR(255), created_at TIMESTAMP, updated_at TIMESTAMP, data TEXT);'
      for (var i = 0, ii = res.length; i < ii; i++) {
        cmds = [];
        filename = res[i];
        if (!jsPat.test(filename)) {
          continue;
        }
        appConfig = require(dirname + '/config/environments/' + filename.replace(jsPat, ''));
        dbConfig = appConfig.database;
        if (dbConfig) {
          sys.puts('Creating DB for ' + filename + '...');
          switch (dbConfig.adapter) {
            // Postgres, the DB of many names
            case 'postgresql':
            case 'postgres':
            case 'psql':
              if (dbConfig.password) {
                cmds.push("export PGPASS='" + dbConfig.password + "'");
              }
              cmds.push('createdb -U ' + dbConfig.username + ' -w ' + dbConfig.dbName);
              cmds.push('echo "db created"');
              cmds.push('psql -U ' + dbConfig.username + ' -d ' + dbConfig.dbName + ' -w -c "' + createStatement + '"');
              if (dbConfig.password) {
                cmds.push("unset PGPASS");
              }
              break;
            case 'sqlite':
              cmds.push("sqlite3 -line " + dbConfig.dbName + ".db '" + createStatement + "'");
              break;
            case 'couchdb':
              var Client = require('geddy-core/lib/clients/couchdb').Client;
              var client = new Client(
                dbConfig.hostname,
                dbConfig.port);
              client.request({url: '/' + dbConfig.dbName, method: 'PUT'},
                  function (response) {
                    if (response.statusCode == 412) {
                      sys.puts('Database already exists.');
                    }
                  }
              );
              break;
            default:
              // Do nothing

          }
        }
        if (cmds.length) {
          runCmds(cmds, function () {
          });
        }
      }
    });
  });

  desc('Drops all data repositories for a Geddy app.');
  task('drop', [], function () {
    fs.readdir('./config/environments', function (err, res) {
      var appConfig;
      var dirname = process.cwd();
      var filename;
      var dbConfig;
      var cmds = [];
      var jsPat = /\.js$/;
      for (var i = 0, ii = res.length; i < ii; i++) {
        filename = res[i];
        if (!jsPat.test(filename)) {
          continue;
        }
        appConfig = require(dirname + '/config/environments/' + filename.replace(jsPat, ''));
        dbConfig = appConfig.database;
        if (dbConfig) {

          switch (dbConfig.adapter) {
            // Postgres, the DB of many names
            case 'postgresql':
            case 'postgres':
            case 'psql':
              if (dbConfig.password) {
                cmds.push("export PGPASS='" + dbConfig.password + "'");
              }
              cmds.push('dropdb -U ' + dbConfig.username + ' -w ' + dbConfig.dbName);
              if (dbConfig.password) {
                cmds.push("unset PGPASS");
              }
              break;
            case 'sqlite':
              cmds.push("rm " + dbConfig.dbName + ".db");
              break;
            case 'couchdb':
              var Client = require('geddy-core/lib/clients/couchdb').Client;
              var client = new Client(
                dbConfig.hostname,
                dbConfig.port);
              client.request({url: '/' + dbConfig.dbName, method: 'DELETE'},
                  function (response) {
                    if (response.statusCode == 404) {
                      sys.puts('Database does not exist to drop.');
                    }
                  }
              );
              break;
            default:
              // Do nothing

          }
        }
        if (cmds.length) {
          runCmds(cmds, function () {
          });
        }
      }
    });
  });
});

// Runs an array of shell commands asynchronously, calling the
// next command off the queue inside the callback from child_process.exec.
// When the queue is done, call the final callback function.

var runCmds = function (arr, callback, printStdout) {
  var run = function (cmd) {
    child_process.exec(cmd, function (err, stdout, stderr) {
      if (err) {
        sys.puts('Error: ' + JSON.stringify(err));
      }
      else if (stderr) {
        sys.puts('Error: ' + stderr);
      }
      else {
        if (printStdout) {
          sys.puts(stdout);
        }
        if (arr.length) {
          var next = arr.shift();
          run(next);
        }
        else {
          if (callback) {
            callback();
          }
        }
      }
    });
  };
  run(arr.shift());
};

