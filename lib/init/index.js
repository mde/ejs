
// Look through the './init' directory, and run the `init`
// method for all listed files -- each `init` method should
// take a callback that runs the next one. When all finished
// call the original top-level callback for the whole init
// process
exports.init = function (app, callback) {
  var items = [
        'router'
      , 'model'
      , 'i18n'
      , 'helpers'
      ]
    , initItem = function () {
        var item = items.shift();
        if (item) {
          item = require('./' + item);
          item.init(app, initItem);
        }
        else {
          callback();
        }
      };
  initItem();
};
