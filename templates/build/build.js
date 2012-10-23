window.geddy = {}

// require model
window.geddy.model = require('model');

// mix utilities into geddy
var utilities = require('utilities');
utilities.mixin(geddy, utilities);

// require socket.io-client
window.geddy.io = require('socket.io-client');
window.geddy.socket = window.geddy.io.connect('http://localhost');

window.geddy.model.startListening = function (models) {
  for (var i in models) {
    // start here
  }
}
