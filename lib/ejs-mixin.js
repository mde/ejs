'use strict';
var ejs = require('./ejs');

var EjsTemplate = ejs.Template;

function MixinTemplate(text, opts) {
  EjsTemplate.call(this, text, opts);
}

MixinTemplate.prototype = Object.create(EjsTemplate.prototype);
MixinTemplate.modes = EjsTemplate.modes; // TODO ?

MixinTemplate.prototype.scanLine = function(line) {
  var name;
  if(this.mode == EjsTemplate.modes.EVAL && (name = line.match(/^\*\s*define\s+(\S+)\s*$/))) {
    this.__mixin_define = 1;
    name = name [1];
    if (!name.match(/\.[^\/]+$/)) name = name + '.ejs'; 
    this.__mixin_define_name = '/'+name;
    this.__mixin_define_src = '';
    return;
  }
  if (! this.__mixin_define) {
    return EjsTemplate.prototype.scanLine.call(this, line);
  }

  if (this.__mixin_define == 1) {
    if (line != this.opts.delimiter + '>') throw new Error('Invalid mixin');
    this.__mixin_define = 2;
    return;
  }
  
  if(this.mode == EjsTemplate.modes.EVAL && line.match(/^\*\s*\/define\s*$/)) {
    this.__mixin_define = undefined;
    
    var func = ejs.compile(this.__mixin_define_src.replace(/<.$/, ''), this.opts);
    ejs.cache.set(this.__mixin_define_name, func);
    return;
  }
  
  this.__mixin_define_src += line;
}


ejs.Template = MixinTemplate;
