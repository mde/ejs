window.geddy = {}

// require model
geddy.model = require('model');

// mix utilities into geddy
var utilities = require('utilities');
utilities.mixin(geddy, utilities);

// require socket.io-client
geddy.io = require('socket.io-client');
geddy.socket = geddy.io.connect('/');

geddy.io.listenForModelEvents = function (model) {
  var events = [
    'save'
  , 'update'
  , 'remove'
  ];

  for (var e in events) {
    (function (event) {
      geddy.socket.on(model.modelName + ':' + event, function (data) {
        var instance;
        if (typeof data != 'string') {
          instance = model.create(data);
        }
        else {
         instance = data;
        }
        if (geddy.debug == true) {
          console.log(event, instance);
        }
        model.emit(event, instance);
      });
    })(events[e]);
  };
}

geddy.io.addListenersForModels = function (models) {
  for (var i in models) {
    (function (model) {
      geddy.io.listenForModelEvents(model);
    })(geddy.model[models[i]]);
  }
}



