geddy.io.sockets.on('connection', function(socket) {
  socket.emit('hello', {message: "world"});
  socket.on('message', function(message) {
    geddy.log.notice(message);
  });
});
