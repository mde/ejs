var helpers = require('./helpers')

task('console', {async: true}, function () {
  var t = jake.Task['env:init'];

  t.addListener('complete', function () {
    var repl = require('repl')
      , rl;

    rl = repl.start({
        prompt: '>>> '
      , input: process.stdin
      , output: process.stdout
    });

    rl.on('close', function () {
      console.log('Exiting...');
      return complete();
    })

    rl.context.capture = function (err, data) {
      return rl.context.results = {
          err: err
        , data: data
      };
    };

    rl.context.echo = function (err, data) {
      rl.context.capture(err, data);
      if (err) {
        console.log('Error: ', err);
      }

      if (data) {
        if (data.length) {
          for (var i in data) {
            if (data[i] && data[i].toData) {
              console.log(data[i].toData());
            } else {
              console.log(data[i]);
            }
          }
        }
        else {
          if (data && data.toData) {
            console.log(data.toData());
          } else {
            console.log(data);
          }
        }
      } else {
        console.log('No data');
      }
    };

    rl.context.routes = function (resource) {
      console.log(helpers.getRoutes(resource));
    };
  });

  t.invoke();
});
