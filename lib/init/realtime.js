var utils = require('utilities');


module.exports = new (function () {
  this.init = function (app, callback) {
    // Load socket.io if it's enabled. This gets run after
    // the server starts listening for requests. Socket.io
    // won't work if we start it before.
    geddy.on('started', function () {
      if (app.config.realtime) {
        geddy.io = utils.file.requireLocal('socket.io').listen(geddy.server, {'log level': 0});
        // add event listeners to all the models
        // set up socket.io emitters for each event

        var events = [
        , 'save'
        , 'update'
        , 'beforeRemove'
        ]

        , registerEventListener = function (model, ev) {
          geddy.model[model].on(ev, function (d) {
            var data
              , id;

            ev = ev.replace('before', '').toLowerCase();

            if (typeof d == 'object') {
              // If data is an object we have to be careful not to mutate it
              if(typeof d.toJSON == 'function') {
                data = d.toJSON();
              }
              else {
                data = JSON.parse(JSON.stringify(d));
              }

              data.model = model;
              data.event = ev;
              id = data.id;
            }
            else {
              id = d;
              data = {id: id};
              data.model = model;
              data.event = ev;
              data = JSON.stringify(data);
            }

            geddy.io.sockets.emit(model + ':' + ev, data);
            geddy.io.sockets.emit(model + ':' + ev + ':' + id, data);
          });
        }

        for (var i in geddy.model.descriptionRegistry) {
          for (var e in events) {
            registerEventListener(i, events[e]);
          }
        }

      }

    });
    callback();
  };

})();



