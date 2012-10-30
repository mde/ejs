var utils = require('utilities')
  , fs = require('fs');

exports.init = function (app, callback) {
  var modelDir = utils.file.readdirR('app/models')
    , files = []
    , file
    , content
    , built;
  for (var i in modelDir) {
    file = modelDir[i].replace('app/models', '').replace('/', '');
    if (file) {
      content = fs.readFileSync(modelDir[i], 'utf8');
      files.push(content);
    }
  }
  built = files.join('\n\n');
  fs.writeFileSync('public/js/core/models.js', built);
  return callback();
};
