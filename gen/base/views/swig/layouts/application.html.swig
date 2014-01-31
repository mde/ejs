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
    {{ styleLink('bootstrap.responsive.min.css', {rel:'stylesheet'}) }}
    {{ styleLink('style.css', {rel:'stylesheet'}) }}
  </head>
  <body>
    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="i-bar"><i class="icon-chevron-down icon-white"></i></span>
          </a>
          <a class="brand" href="{{mainsPath}}">Geddy App</a>
          <div class="nav-collapse">
            <ul class="nav">
              <li class="active"><a href="{{mainsPath}}">Home</a></li>
              <li><a href="http://geddyjs.org/tutorial">Tutorial</a></li>
              <li><a href="http://geddyjs.org/documentation">Docs</a></li>
            </ul>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>
    <div class="container">
      {{ displayFlash(flash) }}
      {{ render() }}
    </div>
  </body>
</html>
