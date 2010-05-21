
var parseopts = new function () {

  var optsReg = {
    geddyRoot: ['-r', '--geddy-root']
    , serverRoot: ['-x', '--server-root']
    , host: ['-h', '--host']
    , port: ['-p', '--port']
    , environment: ['-e', '--environment']
    , restart: ['-Q', '--restart']
  };

  this.parse = function (args) {
    var opts = {};
    var optsReverseMap = {};
    var optsItem;
    for (var p in optsReg) {
      optsItem = optsReg[p];
      for (var i = 0; i < optsItem.length; i++) {
        optsReverseMap[optsItem[i]] = p;
      }
    }

    var arg;
    var argName;
    var argItems;

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = optsReverseMap[argItems[0]];
        if (argName) {
          opts[argName] = argItems[1];
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = optsReverseMap[arg];
        if (argName) {
          opts[argName] = args.shift();
        }
        else {
          throw new Error('Unknown option "' + arg + '"');
        }
      }
    }
    return opts;
  };

};

exports.parse = parseopts.parse;
