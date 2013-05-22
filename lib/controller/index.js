 var utils = require('../utils')
  , BaseController = require('./base_controller').BaseController;

var controller = new (function () {

  this.register = function (name, ctor) {
    this[name] = ctor;
  };

  this.create = function (name) {
    var ctor = this[name];
    if (ctor) {
      // If there's an Application controller, use an instance of it
      // as the prototype of the controller for this request
      if (this.Application) {
        // The constructor for the Application controller
        appCtor = this.Application;
        // Give the constructor a new prototype to inherit from: an instance
        // of the BaseController, with the methods/properties from its original
        // prototype copied over
        appCtor.prototype = utils.enhance(new BaseController(),
            appCtor.origPrototype);
        appCtor.prototype.constructor = appCtor;
        // Make an instance -- this instance will be the proto for the
        // controller for this request
        baseController = new appCtor();
      }
      // If there's no Application controller, use an instance of
      // BaseController as the proto
      else {
        baseController = new BaseController();
      }

      // Give the constructor for this request's controller a new
      // prototype: the Application/BaseController (or just BaseController)
      // instance, with the methods/properties from the original prototype
      // copied over
      ctor.prototype = utils.enhance(baseController,
          ctor.origPrototype);
      ctor.prototype.constructor = ctor;

      return new ctor();
    }
    else {
      return null;
    }
  };

})();

module.exports = controller;
