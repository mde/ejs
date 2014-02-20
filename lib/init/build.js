var utils = require('utilities')
  , path = require('path')
  , fs = require('fs');

var init = function (app, callback) {
  
  if (app.config.disableBuild) {
    return callback();
  }

  setupModels(app);
  setupSharedHelpers(app);

  return callback();
};

var setupModels = function(app) {
  var modelDir = path.join('app/models')
    , cwd = process.cwd()
    , models
    , files = []
    , file
    , content
    , built
    , jsPat = /\.js$/;

  // May be running totally model-less
  if (utils.file.existsSync(path.join(cwd, modelDir))) {
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
  }
}

var setupSharedHelpers = function(app) {
  var helperDir = path.join('app/helpers')
    , cwd = process.cwd()
    , helpers
    , files = []
    , file
    , content
    , built
    , jsPat = /\.shared.js$/;

  if (utils.file.existsSync(path.join(cwd, helperDir))) {
    helpers = utils.file.readdirR(helperDir)
    helpers.forEach(function (item) {
      if (jsPat.test(item)) {
        content = fs.readFileSync(item, 'utf8');
        files.push("(function () {\n" + content + "}());");
      }
    });
    built = files.join('\n\n');
    geddy.file.mkdirP(path.join('public/js/core'));
    fs.writeFileSync('public/js/core/helpers.js', built);
  }
}

exports.init = init;
