var utils = require('utilities')
  , path = require('path')
  , fs = require('fs');

exports.init = function (app, callback) {
  var modelDir = utils.file.readdirR(path.join('app/models'))
    , files = []
    , file
    , content
    , built
    , jsPat = /\.js$/;
  modelDir.forEach(function (item) {
    if (jsPat.test(item)) {
      content = fs.readFileSync(item, 'utf8');
      files.push("(function () {\n" + content + "}());");
    }
  });
  built = files.join('\n\n');
  geddy.file.mkdirP(path.join('public/js/core/'));
  fs.writeFileSync('public/js/core/models.js', built);
  return callback();
};
