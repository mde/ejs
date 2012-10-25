window.geddy = {}

// require model
geddy.model = require('model');

// mix utilities into geddy
var utilities = require('utilities');
utilities.mixin(geddy, utilities);

// require socket.io-client
geddy.io = require('socket.io-client');
geddy.socket = geddy.io.connect('http://localhost');

geddy.io.listenForModelEvents = function (model) {
  var events = [
    'save'
  , 'update'
  , 'remove'
  ];

  for (var e in events) {
    geddy.socket.on(model.modelName + ':' + events[e], function (data) {
      (function (event) {
        model.emit(event, data);
      })(events[e]);
    });
  };
}

geddy.io.addListenersForModels = function (models) {
  for (var i in models) {
    (function (model) {
      geddy.io.listenForModelEvents(model);
    })(geddy.model[models[i]]);
  }
}

