/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://http://apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
var utils = require('../../utils')
  , helperUtils = require('./utils')
  , Data;

// Copy a data object so it can be used in helpers
exports.registerData = {
  name: 'registerData',
  action: function(data) {
    Data = data;
    helperUtils.registerData(data);
  }
}

/*
 * urlFor(options<String/Object>)
 *
 * Returns a URL based on the `options` provided
 *
 * Options <String>:
 *   'back' <String> The 'back' string will return a URL that points to the last URL in history
 *
 * Options <Object>:
 *   relPath       <Boolean>  If true, the relative URL is returned(Default: false)
 *   protocol      <String>   The protocol to use(Default: What your Geddy instance is using('http' default))
 *   username      <String>   Includes a username in the path. Requires `password` or it'll be ignored
 *   password      <String>   Includes a password in the path. Requires `username` or it'll be ignored
 *   subdomain     <String>   Specifies the subdomain to prepend to `domain`
 *   domain        <String>   Specifies the domain to point to. Required if `relPath` is false
 *                            (Default: What your geddy `hostname` is using)
 *   host          <String>   alias for domain
 *   port          <Integer>  Specify the port to connect to
 *   controller    <String>   Specifies the controller to use for the path
 *   action        <String>   Specifies the action to use for the path
 *   id            <String>   Specifies an ID to use for displaying specific items
 *   trailingSlash <Boolean>  If true, adds a trailing slash to the end of the path/domain
 *   fragment      <String>   Appends a fragment to the end of the path/domain
 *   anchor        <String>   alias for fragment
 *
 * Notes:
 *   * If `options` is a String it will just be returned, unless the String is equal to 'back'
 *   * Any other options added will be considered as a query to be appended to the URL
 *
 * Examples:
 *   urlFor('http://google.com')
 *   => 'http://google.com'
 *
 *   urlFor({ controller: 'tasks', action: 'new', host: 'somehost.com' })
 *   => 'http://somehost.com/tasks/new'
 *
 *   urlFor({ controller: 'tasks', action: 'new', relPath: true })
 *   => '/tasks/new'
 *
 *   urlFor({ controller: 'tasks', action: 'new', relPath: true, trailingSlash: true })
 *   => '/tasks/new/'
 *
 *   urlFor({ controller: 'tasks', action: 'new', host: 'somehost.com', protocol: 'https' })
 *   => 'https://somehost.com/tasks/new'
 *
 *   urlFor({ controller: 'tasks', action: 'edit', id: 'IwTEf55ivH', host: 'somehost.com' })
 *   => 'http://somehost.com/tasks/IwTEf55ivH/edit'
 *
 *   urlFor({ controller: 'tasks', action: 'new', host: 'somehost.com', anchor: 'submit' })
 *   => 'http://somehost.com/tasks/new#submit'
 *
 *   urlFor({ controller: 'tasks', action: 'new', host: 'somehost.com', authToken: 'some_token' })
 *   => 'http://somehost.com/tasks/new?authToken=some_token'
*/
exports.urlFor = {
  name: 'urlFor',
  action: function(options) {
    return helperUtils.urls.urlFor(options);
  }
}

/*
 * contentTag(tag<String>, content<String>, htmlOptions<Object>)
 *
 * Returns an HTML element from a given `tag` and includes the `content` and
 * all HTML attributes from `htmlOptions`
 *
 * Examples:
 *   contentTag('p', 'this is some content')
 *   => '<p>this is some content</p>'
 *
 *   contentTag('input', 'sample value')
 *   => '<input value="sample value" />'
 *
 *   contentTag('input', 'sample value', { value: 'override sample value' })
 *   => '<input value="override sample value" />'
 *
 *   contentTag('input', 'sample value', { type: 'text', autofocus: true })
 *   => '<input autofocus="autofocus" type="text" value="sample value" />'
 *
 *   contentTag('a', 'http://google.com')
 *   => '<a href="http://google.com">http://google.com</a>'
 *
 *   contentTag('a', 'hey there', { href: 'http://google.com' })
 *   => '<a href="http://google.com">hey there</a>'
 *
 *   contentTag('a', 'hey there', { href: 'http://google.com', data: { goTo: 'http://google.com' } })
 *   => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'
 *
 *   contentTag('a', 'hey there', { href: 'http://google.com', data_go_to: 'http://google.com' })
 *   => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'
*/
exports.contentTag = {
  name: 'contentTag',
  action: function(tag, content, htmlOptions) {
    return helperUtils.tags.contentTagString(tag, content, htmlOptions);
  }
}

/*
 * linkTo(content<String>, options<String/Object>, htmlOptions<Object>)
 *
 * Generates a link from the given `options`, then returns a anchor tag with the `content`
 * and the `htmlOptions` provided
 *
 * Examples:
 *   linkTo('some content', 'http://google.com')
 *   => '<a href="http://google.com">some content</a>'
 *
 *   linkTo('some content', 'http://google.com', { data: {goTo: 'http://google.com'} })
 *   => '<a data-go-to="http://google.com" href="http://google.com">some content</a>'
*/
exports.linkTo = {
  name: 'linkTo',
  action: function(content, options, htmlOptions) {
    options = options || {};
    htmlOptions = htmlOptions || {};
    var url;

    // If options is a function, assume it was from a action helper
    if(typeof options === 'function') options = String(options());
    url = exports.urlFor.action(options);

    htmlOptions.href = htmlOptions.href || url;

    return exports.contentTag.action('a', content, htmlOptions);
  }
};

/*
 * scriptLink(source<String>, htmlOptions<Object>)
 *
 * Generates a script element pointing to `source` and includes all the given `htmlOptions`
 *
 * Examples:
 *   scriptLink('/js/script.js')
 *   => '<script src="/js/script.js"></script>'
 *
 *   scriptLink('/js/script.js', { type: 'text/javascript' })
 *   => '<script src="/js/script.js" type="text/javascript"></script>'
*/
exports.scriptLink = {
  name: 'scriptLink',
  action: function(source, htmlOptions) {
    htmlOptions = htmlOptions || {};
    htmlOptions = utils.object.reverseMerge(htmlOptions, { src: source })

    return exports.contentTag.action('script', '', htmlOptions);
  }
};

/*
 * styleLink(source<String>, htmlOptions<Object>)
 *
 * Generates a style element pointing to `source` and includes all the given `htmlOptions`
 *
 * Examples:
 *   styleLink('/css/styles.css')
 *   => '<link href="/css/style.css" />'
 *
 *   styleLink('/css/styles.css', { type: 'text/javascript' })
 *   => '<link href="/css/style.css" rel="stylesheet" />'
*/
exports.styleLink = {
  name: 'styleLink',
  action: function(source, htmlOptions) {
    htmlOptions = htmlOptions || {};

    return exports.contentTag.action('link', source, htmlOptions);
  }
};

/*
 * imageTag(source<String>, htmlOptions<Object>)
 *
 * Returns an image tag with the src to a `source` and includes all the given `htmlOptions`
 *
 * Custom HTML Options:
 *  size <String> This takes a string including the width and height "{width}x{height}"(e,g: '40x50')
 *                or it can take a single string including a integer "{size}"(e,g: '40')
 *                The first once parse will output "height='50' width='40'"
 *                The second parses to "height='40' width='40'"
 *                Note: If the format doesn't comply with either of those, it will be ignored
 *
 * Examples:
 *   imageTag('images/google.png')
 *   => '<img alt="images/google.png" src="images/google.png" />'
 *
 *   imageTag('images/google.png', { alt: '' })
 *   => '<img alt="" src="images/google.png" />'
 *
 *   imageTag('images/google.png', { alt: '', size: '40x50' })
 *   => '<img alt="" height="50" src="images/google.png" width="40" />'
 *
 *   imageTag('images/google.png', { alt: '', size: 'a string' })
 *   => '<img alt="" src="images/google.png" />'
*/
exports.imageTag = {
  name: 'imageTag',
  action: function(source, htmlOptions) {
    htmlOptions = htmlOptions || {};

    // If size option is included
    if('size' in htmlOptions) {
      var size = htmlOptions.size
        , pat = /([0-9]+x[0-9]*|[0-9]+)/;

      if(size.match(pat)) {
        delete htmlOptions.size;

        if(size.match(/[0-9]+x[0-9]*/)) {
          // It's seperate width and height
          htmlOptions.width = htmlOptions.width || size.replace(/x[0-9]*/, '');
          htmlOptions.height = htmlOptions.height || size.replace(/[0-9]+x/, '');
        } else {
          // Same size width and height
          htmlOptions.width = htmlOptions.width || size;
          htmlOptions.height = htmlOptions.height || size;
        }
      } else delete htmlOptions.size;
    }

    return exports.contentTag.action('img', source, htmlOptions);
  }
}

/*
 * imageLink(source<String>, link<String/Object>, imageOptions<Object>, linkOptions<Object>)
 *
 * Returns an anchor tag to a given `link` with the given `linkOptions`, with the content being a
 * image tag to the given `source` and includes it's `imageOptions`
 *
 * Examples:
 *   imageLink('images/google.png', 'http://google.com')
 *   => '<a href="http://google.com"><img alt="images/google.png" src="images/google.png" /></a>'
 *
 *   imageLink('images/google.png', 'http://google.com', { alt: '' })
 *   => '<a href="http://google.com"><img alt="" src="images/google.png" /></a>'
 *
 *   imageLink('images/google.png', 'http://google.com', { alt: '', size: '40x50' })
 *   => '<a href="http://google.com"><img alt="" height="50" src="images/google.png" width="40" /></a>'
*/
exports.imageLink = {
  name: 'imageLink',
  action: function(source, link, imageOptions, linkOptions) {
    imageOptions = imageOptions || {};
    linkOptions = linkOptions || {};

    // If link is a function, assume it was from a action helper
    if(typeof link === 'function') link = String(link());
    linkOptions = utils.object.merge(linkOptions, { href: link });

    var imageTag = exports.imageTag.action(source, imageOptions);
    return exports.linkTo.action(imageTag, link, linkOptions)
  }
}

/*
 * truncate(string<String>, options<Integer/Object>, callback[Function])
 *
 * Truncates a given `string` after a specified `length` if `string` is longer than
 * `length`. The last characters will be replaced with an `omission` for a total length not
 * exceeding `length`. If `callback` is given it will fire if `string` is truncated.
 *
 * Options:
 *   length    <Integer>          Length the output string will be(default: 30)
 *   len       <Integer>          Alias for length
 *   omission  <String>           Replace last letters with an omission(default: '...')
 *   ellipsis  <String>           Alias for omission
 *   seperator <String>/<RegExp>  Break the truncated text at the nearest `seperator`
 *
 * Warnings:
 *   Please be aware that truncating HTML tags or entities may result in malformed HTML returned
 *
 * Examples:
 *   truncate('Once upon a time in a world', { length: 10 })
 *   => 'Once up...'
 *
 *  truncate('Once upon a time in a world', { length: 20, omission: '...(continued)' })
 *   => 'Once u...(continued)'
 *
 *  truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
 *   => 'Once upon a...'
 *   Normal Output: => 'Once upon a ...'
 *
 *  truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
 *   => 'Once upon a...'
 *   Normal Output: => 'Once upon a ...'
 *
 *  truncate('<p>Once upon a time</p>', { length: 20 })
 *   => '<p>Once upon a ti...'
 */
exports.truncate = {
  name: 'truncate',
  action: utils.string.truncate
};

/*
 * truncateHTML(string<String>, options<Object>, callback[Function])
 *
 * Truncates a given `string` inside HTML tags after a specified `length` if `string` is longer than
 * `length`. The last characters will be replaced with an `omission` for a total length not
 * exceeding `length`. If `callback` is given it will fire if `string` is truncated. If `once` is
 * true only the first string in the first HTML tags will be truncated leaving the others as they
 * were
 *
 * Options:
 *   once <Boolean> If true it will only truncate the first text found in the first
 *                  set of HTML tags(default: false)
 *
 * Notes:
 *   * All options available in the `truncate` helper are also available in `truncateHTML`
 *   * HTML tags will not be truncated, so return value will always be safe for rendering
 *
 * Examples:
 *   truncateHTML('<p>Once upon a time in a world</p>', { length: 10 })
 *   => '<p>Once up...</p>'
 *
 *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 })
 *   => '<p>Once up...<small>in a wo...</small></p>'
 *
 *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true })
 *   => '<p>Once up...<small>in a world</small></p>'
 */
exports.truncateHTML = {
  name: 'truncateHTML',
  //altName: 'truncate_HTML',
  action: utils.string.truncateHTML
};
