var utils = require('utilities')
  , path = require('path')
  , fs = require('fs');

exports.init = function (app, callback) {
  var modelDir = path.join('app/models')
    , cwd = process.cwd()
    , models
    , files = []
    , file
    , content
    , built
    , jsPat = /\.js$/;

  // May be running totally model-less
  if (!utils.file.existsSync(path.join(cwd, modelDir))) {
    return callback();
  }

  models = utils.file.readdirR(modelDir)
  models.forEach(function (item) {
    if (jsPat.test(item)) {
      content = fs.readFileSync(item, 'utf8');
      files.push("(function () {\n" + content + "}());");
    }
  });
  built = files.join('\n\n');
  geddy.file.mkdirP(path.join('public/js/core'));
  fs.writeFileSync('public/js/core/models.js', built);
  return callback();
};
