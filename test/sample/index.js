var express = require('express'),
    ejs = require('../../lib/ejs.js');
var app = express();
app.engine('.html', ejs.__express);
app.set('view engine', 'ejs');
app.get('/', function(req, res) {
	res.render(__dirname + '/index.html', {header: 'Hello EJS'});
});
var server = app.listen(3000, function () {
  console.log('Example app listening at http://localhost:3000');
});