<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Geddy App | This app uses Geddy.js</title>
    <meta name="description" content="">
    <meta name="author" content="">
    <meta name="viewport" content="width=device-width" />

    <!-- The HTML5 shim, for IE6-8 support of HTML elements -->
    <!--[if lt IE 9]>
      {{ scriptLink('http://html5shim.googlecode.com/svn/trunk/html5.js', {type: 'text/javascript'}) }}
    <![endif]-->
    {{ scriptLink('jquery.min.js', {type: 'text/javascript'}) }}
    {{ scriptLink('bootstrap.min.js', {type: 'text/javascript'}) }}
    {{ scriptLink('config/init.js', {type: 'text/javascript'}) }}

    {{ styleLink('bootstrap.min.css', {rel:'stylesheet'}) }}
    {{ styleLink('bootstrap-theme.min.css', {rel:'stylesheet'}) }}
    {{ styleLink('style.css', {rel:'stylesheet'}) }}
  </head>
  <body>
    <div class="navbar navbar-default" role="navigation">
      <div class="container">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
              <span class="sr-only">Toggle navigation</span>
              <span class="glyphicon glyphicon-bar"></span>
              <span class="glyphicon glyphicon-bar"></span>
              <span class="glyphicon glyphicon-bar"></span>
            </button>
          <a class="navbar-brand" href="{{mainsPath}}">Geddy App</a>
        </div>
        
          <div class="navbar-collapse collapse">
            <ul class="nav navbar-nav">
              <li class="active"><a href="{{mainsPath}}">Home</a></li>
              <li><a href="http://geddyjs.org/tutorial">Tutorial</a></li>
              <li><a href="http://geddyjs.org/documentation">Docs</a></li>
            </ul>
          </div><!--/.navbar-collapse -->
      </div>
    </div>
    <div class="container">
       {{ displayFlash(flash) }}
       {{ render() }}
    </div>
  </body>
</html>
