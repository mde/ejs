#!/usr/bin/env node

require('./color');
var data
  , engine_options
  , yield
  , output
  , engines
  , enginesText
  , engine
  , engineText
  , i
  , Templato
  , templato
  , errors = []
  , compiled
  , test;

// Helpers
data = { content: 'content text' };
engine_options = {};
output = "hey<p>some text in paragraph</p>content text";
outputHTML = "<a href='#'>hey</a><p>some text in paragraph</p>content text";

// Data
engines = ['ejs', 'geddy_ejs', 'jade', 'mustache', 'handlebars'];
enginesText = [
    '<%= yield() %><p>some text in paragraph</p><%= content %>'
  , '<%= yield(); %><p>some text in paragraph</p><%= content; %>'
  , '= yield()\np some text in paragraph\n= content'
  , '{{yield}}<p>some text in paragraph</p>{{content}}'
  , '{{yield}}<p>some text in paragraph</p>{{content}}'
];
enginesTextHTML = [
    '<%- yieldHTML() %><p>some text in paragraph</p><%= content %>'
  , '<%= yieldHTML(); %><p>some text in paragraph</p><%= content; %>'
  , '!= yieldHTML()\np some text in paragraph\n= content'
  , '{{{yieldHTML}}}<p>some text in paragraph</p>{{content}}'
  , '{{{yieldHTML}}}<p>some text in paragraph</p>{{content}}'
];

Templato = require('./index');
Templato.registerHelper('yield', function() { return 'hey'; });
Templato.registerHelper('yieldHTML', function() { return "<a href='#'>hey</a>"; });

test = function(options, engine_options) {
  options = options || {};
  engine_options = engine_options || {};

  templato = new Templato;
  templato.set({
      engine: options.engine
    , template: options.template
    , options: engine_options
  });

  try {
    compiled = templato.render(options.data);

    if(compiled === options.output) {
      content = '==> '.cyan + options.engine + ' passed'.green;
      if(options.html) content += ' html_mode'.blue;

      console.log(content);
    } else {
      if(options.html) {
        errors.push(options.engine.red + ': '.red + 'html_mode '.blue + '\n  Output:   ' + compiled + '\n  Expected: ' + options.output);
      } else errors.push(options.engine.red + ': '.red + compiled);

      content = '==> '.cyan + options.engine + ' failed, output not same'.red;
      if(options.html) content += ' html_mode'.blue;

      console.log(content);
    }
  } catch(err) {
    if(options.html) {
      errors.push(options.engine.red + ': '.red + 'html_mode '.blue + err);
    } else errors.push(options.engine.red + ': '.red + err);

    content = '==> '.cyan + options.engine + ' failed from compile error'.red;
    if(options.html) content += ' html_mode'.blue;

    console.log(content);
  }
};

console.log('\nTesting normal output:');
for(i in engines) {
  test({
      engine: engines[i]
    , template: enginesText[i]
    , data: data
    , output: output
  }, engine_options);
}

console.log('\nTesting HTML output:');
for(i in engines) {
  test({
      engine: engines[i]
    , template: enginesTextHTML[i]
    , data: data
    , output: outputHTML
    , html: true
  }, engine_options);
}

// Log errors once finished
console.log('\nErrors:');
for(i in errors) {
  console.log(errors[i]);
}
