'use strict';
var ejs = require('../lib/ejs');
var utils = require('../lib/utils');

var EjsTemplate = ejs.Template;

function SnippetTemplate(text, opts) {
  EjsTemplate.call(this, text, opts);
  this.__pluginSnippetsKnown = {};
}

SnippetTemplate.prototype = Object.create(EjsTemplate.prototype);

SnippetTemplate.prototype.getModeMap = function () {
  var m = EjsTemplate.prototype.getModeMap.apply(this, arguments);
  if (! ejs.modes.CONTROL) {
    ejs.modes.CONTROL = 'control';
  }
  if (! Object.keys(m).filter(function(k) { return m[k] === ejs.modes.CONTROL; }).length) {
    m['*'] = ejs.modes.CONTROL;
  }
  return m;
};

SnippetTemplate.prototype.scanTextLine = function (line) {
  if (! this.__pluginSnippetParsingDefine) {
    // not in snippet parsing mode
    return EjsTemplate.prototype.scanTextLine.apply(this, arguments);
  }
  this.__pluginSnippetParsingSource += line;
};

SnippetTemplate.prototype.scanTagLine = function (openTag, line, closeTag) {
  var name;
  var mode = this.modeMap[openTag];
  if(mode == ejs.modes.CONTROL && (name = line.match(/^\s*snippet\s+(\S+)\s*$/))) {
    // found a new "<%* snippet" section
    this.__pluginSnippetParsingDefine = true;
    name = name [1];
    this.__pluginSnippetParsingName = name;
    this.__pluginSnippetParsingSource = '';
    return;
  }
  if (! this.__pluginSnippetParsingDefine) {
    // not in snippet parsing mode
    return EjsTemplate.prototype.scanTagLine.apply(this, arguments);
  }

  if(mode == ejs.modes.CONTROL && line.match(/^\s*\/snippet\s*$/)) {
    // found closing "<% /snippet"
    this.__pluginSnippetParsingDefine = undefined;

    // source contains the "<%" of the section closing tag
//    var func = ejs.compile(this.__pluginSnippetParsingSource.replace(/<.$/, ''), this.opts);
    var func = ejs.compile(this.__pluginSnippetParsingSource, this.opts);
    this.__pluginSnippetsKnown[this.__pluginSnippetParsingName] = func;
    return;
  }

  // add to snippet source
  this.__pluginSnippetParsingSource += '<'+this.opts.delimiter+openTag + line + closeTag+this.opts.delimiter+'>';
};

/* __pluginSnippetReplace
  will be called from inside the template "<%- snippet('foo') %>", to insert code from a snippet
  - this and snippet are bound
  - name and data are supplied by the code in the template
*/
SnippetTemplate.prototype.__pluginSnippetReplace = function (snippets, name, data) {
  var opts = this.opts;
  var sn = snippets[name];
  if (! sn) {
    throw new Error('unknown snippet: '+name);
  }
  var d = utils.shallowCopy({}, sn.data);
  if (data) {
    data = utils.shallowCopy(d, data);
  } else {
    data = d;
  }
  return sn.code.call(opts.context, data, sn.callerFnArgs);
};

/* __pluginSnippetPrepare
 * create snippets, associated with data from current call to template
 */
SnippetTemplate.prototype.__pluginSnippetPrepare = function (snippets, data, callerFnArgs) {
  var r = {};
  Object.keys(snippets).map(function(k) {
    var s = snippets[k];
    r[k] = { code: s, data: data, callerFnArgs: callerFnArgs };
  });
  return r;
};

SnippetTemplate.prototype.compile = function () {
  var opts = this.opts;
  var fn = EjsTemplate.prototype.compile.apply(this, arguments);
  if (opts.client) {
    return fn;
  }

  var self = this;
  var newFn = function (data, callerFnArgs) {
    if (callerFnArgs && callerFnArgs.snippet) {
      var d = utils.shallowCopy({}, data);
      var snippedData = self.__pluginSnippetPrepare(self.__pluginSnippetsKnown, d, callerFnArgs);
      // add snippets to existing data
      utils.shallowCopy(callerFnArgs.snippet.snippedData, snippedData);
    }
    return fn.apply(self, arguments);
  };
  newFn.dependencies = fn.dependencies;
  return newFn;
};

SnippetTemplate.prototype.generateArgumentNames = function () {
  var r = EjsTemplate.prototype.generateArgumentNames.apply(this, arguments);
  if (this.opts.client) {
    return r;
  }
  return r.concat(['snippet']);
};

SnippetTemplate.prototype.generateArguments = function (data, opts, ejsArgs, callerFnArgs) {
  var r = EjsTemplate.prototype.generateArguments.apply(this, arguments);
  if (this.opts.client) {
    return r;
  }

  var snippetFn = callerFnArgs.snippet;
  if (! snippetFn) {
    // top level template, create "snippet" function
    var d = utils.shallowCopy({}, data);
    var snippedData = this.__pluginSnippetPrepare(this.__pluginSnippetsKnown, d, callerFnArgs);
    snippetFn = this.__pluginSnippetReplace.bind(this, snippedData);
    snippetFn.snippedData = snippedData;
    callerFnArgs.snippet = snippetFn;
  }

  r.snippet = snippetFn;
  return r;
};


ejs.Template = SnippetTemplate;
