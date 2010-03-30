var http = require('http');
var sys = require('sys');
var fs = require('fs');
var fleegix = require('./fleegix');
var errors = require('./errors');
var response = require('./response');

var Controller = require('./controller').Controller;

var App = function (initData) {
  var _this = this;

  this.initData = initData;
  this.router = initData.router;
  this.controllers = initData.controllers;
  this.templates = initData.templates;
  this.req = null;
  this.resp = null;

  this.run = function (req, resp) {
    this.req = req;
    this.resp = resp;

    var url = req.url;
    var base = fleegix.url.getBase(url);
    var route = this.router.parse(base, req.method);
    
    try {
      // If the route is a match, run the matching controller/action
      if (route) {
        var qs = fleegix.url.getQS(url);
        var qsParams = fleegix.url.qsToObject(qs);
        var params = fleegix.mixin(route.params, qsParams);

        // Instantiate the matching controller from the registry
        var constructor = this.controllers[route.controller];
        // Give it all the base Controller fu 
        constructor.prototype = new Controller(this, route.controller, params, req, resp);
        var controller = new constructor();

        // Mix in any user-defined Application methods
        var mixin = new this.controllers.Application();


        controller[route.action].call(controller, params);
      }
      else {
        // In dev mode, also serve static files
        if (initData.environment = 'development') {
          var path = initData.staticFilePath + req.url;
          fs.stat(path, function (err, stats) {
            // File not found, hand back the 404
            if (err) {
              var e = new errors.NotFoundError('Page ' + req.url + ' not found.');
              var r = new response.Response(resp);
              r.send(e.message, 'text/html', e.statusCode);
            }
            else {
              var r = new response.Response(resp);
              r.sendFile(path);
            }
          });
        }
        // Otherwise shoot back the 404
        else {
          throw new errors.NotFoundError('Page ' + req.url + ' not found.');
        }
      }
     }
     // Catch all errors, respond with error page & HTTP error code 
     catch (e) {
      var r = new response.Response(this.resp);
      r.send(e.message, 'text/html', e.statusCode);
     }
  }
};

exports.App = App;
