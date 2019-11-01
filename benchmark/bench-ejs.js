'use strict';

var ejs = require('..');
var path = require('path');

ejs.fileLoader = function(n) { return files[path.basename(n, '.ejs')]; };

var loops = 10000;
var runs = 9;  // min 4 for median

var runCompile = false;
var runNoCache = false;
var runCache = false;

var i = 1;
while (i < process.argv.length) {
  var a = process.argv[i];
  i++;
  var b;
  if (i < process.argv.length) b = process.argv[i];
  switch (a) {
  case '-r': if(b) runs = b;
    i++;
    break;
  case '-l': if(b) loops = b;
    i++;
    break;
  case '--compile':
    runCompile = true;
    break;
  case '--nocache':
    runNoCache = true;
    break;
  case '--cache':
    runCache = true;
    break;
  }
}

if (! (runCompile || runNoCache || runCache)) {
  runCompile = true;
  runNoCache = true;
  runCache = true;
}

var files = {
  bench1: `<h1><$= name $></h1>
    <div><%- num+1 -%></div>
    <% if(num > 10) { %>
      <$= cheese $>
    <% } %>
    <%# comment #%>
    <%% literal <$= name $> %%>
  `,

  bench2: `<h1><$= name $></h1>
    <div><%- num+1 -%></div>
    <% if(num > 10) { %>
      <$= cheese $>
    <% } %>
    <%# comment #%>
    <%% literal <$= name $> %%>
  `.repeat(100),

  simple1: `<h1><$= name $></h1>
    <div><%- num+1 -%></div>
  `,

  locals1: `<h1><$= locals.name $></h1>
    <div><%- locals.num+1 -%></div>
    <% if(locals.num > 10) { %>
      <$= locals.cheese $>
    <% } %>
    <%# comment #%>
    <%% literal <$= locals.name $> %%>
  `.repeat(10),

  include1: `<h1><$= name $></h1>
    <div><% include('/simple1') %></div>
    <div><% include('/simple1') %></div>
    <div><% include('/simple1') %></div>
  `,

  include2: `<h1><$= name $></h1>
    <div><% include /include1 %></div>
    <div><% include /simple1 %></div>
  `,
};

var data = {
  name: 'foo',
  num: 42,
  cheese: 'out of',
};

var sp = '                                                            ';
function fill(s, l) { s=String(s); return s + sp.slice(0,l-s.length); }
function fillR(s, l) { s=String(s); return sp.slice(0,l-s.length)+s; }

function log(name, runTimes, totalLoops) {
  runTimes = runTimes.sort(function(a,b) { return a-b; });
  var m  = Math.trunc(runs/2);
  var m2 = (runs % 2 == 0) ? m-1 : m;
  var med1 = Math.round((runTimes[m]+runTimes[m2])/2);
  var med2;
  if (runs % 2 == 0)
    med2 = Math.round((runTimes[m2-1]+runTimes[m2]+runTimes[m]+runTimes[m+1])/4);
  else
    med2 = Math.round((runTimes[m-1]+runTimes[m]+runTimes[m+1])/3);
  var avg = Math.round(runTimes.reduce(function(a,b) {return a+b;}) / runTimes.length);
  console.log(fill(name +': ',30), fill(avg/1000,10), fill(med1/1000,10), fill(med2/1000,10), fill(runTimes[0]/1000,10), fill(runTimes[runTimes.length-1]/1000,10),fillR(totalLoops, 15));
}

function benchRender(name, file, data, opts, benchOpts) {
  ejs.cache.reset();
  var runTimes = [];
  opts = opts || {};
  benchOpts = benchOpts || {};
  opts.filename = file;
  var totalLoops = Math.round(loops * (benchOpts.loopFactor || 1));
  var tmpl = files[file];
  for (var r = 0; r < runs; r++) {
    ejs.render(tmpl, data, opts); // one run in advance

    var t = Date.now();
    for (var i = 0; i < totalLoops; i++) {
      ejs.render(tmpl, data, opts);
    }
    t = Date.now() - t;
    runTimes.push(t);
  }
  log(name, runTimes, totalLoops);
}

function benchCompile(name, file, opts, benchOpts) {
  ejs.cache.reset();
  var runTimes = [];
  opts = opts || {};
  benchOpts = benchOpts || {};
  opts.filename = file;
  var totalLoops = Math.round(loops * (benchOpts.loopFactor || 1));
  var tmpl = files[file];
  for (var r = 0; r < runs; r++) {
    ejs.compile(tmpl, opts); // one run in advance

    var t = Date.now();
    for (var i = 0; i < totalLoops; i++) {
      ejs.compile(tmpl, opts);
    }
    t = Date.now() - t;
    runTimes.push(t);
  }
  log(name, runTimes, totalLoops);
}

if (runCompile) {
  console.log('Running avg accross: ', runs);
  console.log(fill('name: ',30), fill('avg',10), fill('med',10), fill('med/avg',10), fill('min',10), fill('max',10), fillR('loops',15));

  benchCompile('single tmpl compile',         'bench1', {compileDebug: false}, { loopFactor: 2 });
  benchCompile('single tmpl compile (debug)', 'bench1', {compileDebug: true}, { loopFactor: 2 });

  benchCompile('large tmpl compile',         'bench2', {compileDebug: false}, { loopFactor: 0.1 });

  benchCompile('include-1 compile',  'include1', {compileDebug: false}, { loopFactor: 2 });
  console.log('-');
}



if (runCache) {
  benchRender('single tmpl cached',           'bench1', data, {cache:true, compileDebug: false}, { loopFactor: 5 });
  benchRender('single tmpl cached (debug)',   'bench1', data, {cache:true, compileDebug: true}, { loopFactor: 5 });

  benchRender('large tmpl cached',           'bench2', data, {cache:true, compileDebug: false}, { loopFactor: 0.4 });
  benchRender('include-1 cached',    'include1', data, {cache:true, compileDebug: false}, { loopFactor: 2 });
  benchRender('include-2 cached',    'include2', data, {cache:true, compileDebug: false}, { loopFactor: 2 });


  benchRender('locals tmpl cached "with"',    'locals1', data, {cache:true, compileDebug: false, _with: true}, { loopFactor: 3 });
  benchRender('locals tmpl cached NO-"with"', 'locals1', data, {cache:true, compileDebug: false, _with: false}, { loopFactor: 3 });

  console.log('-');
}


if (runNoCache) {
  benchRender('single tmpl NO-cache',         'bench1', data, {cache:false, compileDebug: false});
  benchRender('single tmpl NO-cache (debug)', 'bench1', data, {cache:false, compileDebug: true});

  benchRender('large tmpl NO-cache',         'bench2', data, {cache:false, compileDebug: false}, { loopFactor: 0.1 });

  benchRender('include-1 NO-cache',  'include1', data, {cache:false, compileDebug: false});
  benchRender('include-2 NO-cache',  'include2', data, {cache:false, compileDebug: false});
}
