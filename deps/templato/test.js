#!/usr/bin/env node

require('./color');
var data
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
  , compiled;

// Helpers
data = { content: 'content text' };
output = "hey<p>some text in paragraph</p>content text";

// Data
engines = ['ejs', 'geddy_ejs', 'jade', 'mustache', 'handlebars'];
enginesText = [
    '<%= yield() %><p>some text in paragraph</p><%= content %>'
  , '<%= yield(); %><p>some text in paragraph</p><%= content; %>'
  , '= yield()\np some text in paragraph\n= content'
  , '{{yield}}<p>some text in paragraph</p>{{content}}'
  , '{{yield}}<p>some text in paragraph</p>{{content}}'
];

Templato = require('./index');
Templato.registerHelper('yield', function() { return 'hey'; });

for(i in engines) {
  engine = engines[i]
  engineText = enginesText[i];

  templato = new Templato;
  templato.set({
      engine: engine
    , template: engineText
  });

  try {
    compiled = templato.render(data);

    if(compiled === output) {
      console.log('==> '.cyan + engine + ' passed'.green);
    } else {
      errors.push(engine.red + ': '.red + compiled);
      console.log('==> '.cyan + engine + ' failed, output not same'.red);
    }
  } catch(err) {
    errors.push(engine.red + ': '.red + err);
    console.log('==> '.cyan + engine + ' failed from compile error'.red);
  }
};

console.log('\nErrors:');
for(i in errors) {
  console.log(errors[i]);
}
