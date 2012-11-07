var utils = require('utilities')
  , fs = require('fs');

exports.init = function (app, callback) {
  var modelDir = utils.file.readdirR('app/models')
    , files = []
    , file
    , content
    , built;
  for (var i in modelDir) {
      file = modelDir[i].replace('app/models', '').replace('app\\models', '').replace('/', '').replace('\\', '');
    if (file) {
      content = fs.readFileSync(modelDir[i], 'utf8');
      files.push("(function(){\n" + content + "}());");
    }
  }
  built = files.join('\n\n');
  geddy.file.mkdirP('public/js/core/');
  fs.writeFileSync('public/js/core/models.js', built);
  return callback();
};
