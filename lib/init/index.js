
// Look through the './init' directory, and run the `init`
// method for all listed files -- each `init` method should
// take a callback that runs the next one. When all finished
// call the original top-level callback for the whole init
// process
exports.init = function (callback) {
  var items = [
        'model'
      , 'i18n'
      ]
    , initItem = function () {
        var item = items.shift();
        if (item) {
          item = require('./' + item);
          item.init(initItem);
        }
        else {
          callback();
        }
      };
  initItem();
};
