// Load the basic Geddy toolkit
require('../../lib/geddy')

var cwd = process.cwd()
  , fs = require('fs')
  , path = require('path')
  , utils = require('../../lib/utils')
  , Adapter = require('../../lib/template/adapters');

namespace('db', function () {
  task('createTable', ['env:init'], function (name) {

    var modelName
      , createTable
      , adapters
      , adapter;

    if (typeof name == 'string') {
      if (name.indexOf('%') > -1) {
        modelNames = name.split('%');
      }
      else {
        modelNames = [name];
      }
    }
    else {
      modelNames = name;
    }

    createTable = function () {
      if ((m = modelNames.shift())) {

        // Make sure this is a correct model-name
        m = utils.string.getInflections(m).constructor.singular;
        if (!geddy.model[m]) {
          throw new Error(m + ' is not a known model.');
        }

        adapter = geddy.model.adapters[m];
        if (adapter) {
          console.log('Creating table for ' + m);
          adapter.createTable(m, function (err, data) {
            if (err) { throw err }
            createTable();
          });
        }
        else {
          createTable();
        }
      }
      else {
        complete();
      }
    };
    // Defer until associations are set up
    setTimeout(function () {
      createTable();
    }, 0);
  }, {async: true});

  task('init', ['env:init'], function () {
    var modelNames = Object.keys(geddy.model.descriptionRegistry)
      , createTask = jake.Task['db:createTable'];
      createTask.once('complete', function () {
        complete();
      });
      createTask.invoke(modelNames);
  }, {async: true});

});
