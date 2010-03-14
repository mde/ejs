http = require('http');

var sys = require('sys');
var fleegix = require('./fleegix');

var App = function (config) {
  var _this = this;

  this.config = config;
  this.router = config.router;
  this.controllers = config.controllers;
  this.req = null;
  this.resp = null;

  this.run = function (req, resp) {
    this.req = req;
    this.resp = resp;

    var url = req.url;
    var base = fleegix.url.getBase(url);
    var route = this.router.find(base);
    
    if (route) {
      var qs = fleegix.url.getQS(url);
      var qsParams = fleegix.url.qsToObject(qs);
      var params = fleegix.mixin(route.params, qsParams);
      var constructor = this.controllers[route.controller];
      constructor.prototype = new Controller(req, resp);
      var controller = new constructor();

      controller[route.action].call(controller, params);
    }
    else {
      this.resp.writeHead(404, {'Content-Type': 'text/plain'});
      this.resp.write('404: Oops, page not found.');
      this.resp.close();

    }
  }
};

var Controller = function (req, resp) {
  this.request = req;
  this.response = resp;
  this.content = '';
};

Controller.prototype = new function () {
  this.render = function (content) {
    if (typeof content != 'undefined') {
      this.content = content;
    }
    this.response.writeHead(200, {'Content-Type': 'text/plain'});
    this.response.write(this.content);
    this.response.close();
  };
}();

exports.App = App;
