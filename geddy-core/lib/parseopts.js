var sys = require('sys');

var parseopts = new function () {

  var optsReg = {
    geddyRoot: ['-r', '--geddy-root']
    , serverRoot: ['-x', '--server-root']
    , workers: ['-n', '--workers']
    //, host: ['-H', '--host']
    , help: ['-h', '--help']
    , version: ['-v', '--version']
    , port: ['-p', '--port']
    , environment: ['-e', '--environment']
    , restart: ['-Q', '--restart'] // Used internally only
  };

  this.parse = function (args) {
    var cmds = [];
    var opts = {};
    var optsReverseMap = {};
    var optsItem;
    var arg;
    var argName;
    var argItems;

    for (var p in optsReg) {
      optsItem = optsReg[p];
      for (var i = 0; i < optsItem.length; i++) {
        optsReverseMap[optsItem[i]] = p;
      }
    }

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = optsReverseMap[argItems[0]];
        if (argName) {
          // If there's no attached value, value is null
          opts[argName] = argItems[1] || (!args[0] || (args[0].indexOf('-') == 0)) ?
                  null : args.shift();
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = optsReverseMap[arg];
        if (argName) {
          // If there is no following item, or the next item is
          // another opt, value is null
          opts[argName] = (!args[0] || (args[0].indexOf('-') == 0)) ?
              null : args.shift();
        }
        else {
          throw new Error('Unknown option "' + arg + '"');
        }
      }
      else {
        cmds.push(arg);
      }
    }
    
    return {cmds: cmds, opts: opts};
  };

};

exports.parse = parseopts.parse;

