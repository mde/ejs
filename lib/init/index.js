var utils = require('utilities');

// Look through the './init' directory, and run the `init`
// method for all listed files -- each `init` method should
// take a callback that runs the next one. When all finished
// call the original top-level callback for the whole init
// process
exports.init = function () {
  var args = Array.prototype.slice.call(arguments)
    , callback = args.pop()
    , app = args.shift()
    , opts = args.shift() || {}
    , items = [
        'checkCompat'
      , 'inFlight'
      , 'build'
      , 'router'
      , 'model'
      , 'controller'
      , 'view'
      , 'i18n'
      , 'session'
      , 'helpers'
      , 'realtime'
      , 'mailer'
      , 'localAppInit'
      ]
    , initItem = function () {
        var item = utils.string.snakeize(items.shift());
        if (item) {
          item = require('./' + item);
          item.init(app, initItem);
        }
        else {
          callback();
        }
      };
  if (opts.initItems && opts.initItems.length) {
    items = items.filter(function (item) {
      return opts.initItems.indexOf(item) > -1;
    });
  }
  initItem();
};
