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
  action: function(data) { Data = data; }
}

exports.urlFor = {
  name: 'urlFor',
  action: function(options) {}
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
    return helperUtils.contentTagString(tag, content, htmlOptions);
  }
}

exports.linkTo = {
  name: 'linkTo',
  action: function() {
  }
};

exports.scriptLink = {
  name: 'scriptLink',
  action: function() {}
};

exports.styleLink = {
  name: 'styleLink',
  action: function() {}
};

/*
 * imageLink(source<String>, link<String>, imageOptions<Object>, linkOptions<Object>)
 *
 * Returns a anchor tag to a `link` and include the img tag at `source`, including the given
 * `htmlOptions`
 *
 * Custom HTML Options:
 *  size <String> This takes a string including the width and height "{width}x{height}"(e,g: '40x50')
 *                or it can take a single string including a integer "{size}"(e,g: '40')
 *                The first once parse will output "height='50' width='40'"
 *                The second parses to "height='40' width='40'"
 *                Note: If the format doesn't comply with either of those, it will be ignored
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
    // If size option is included
    if('size' in imageOptions) {
      var size = imageOptions.size
        , pat = /([0-9]+x[0-9]*|[0-9]+)/;

      if(size.match(pat)) {
        delete imageOptions.size;

        if(size.match(/[0-9]+x[0-9]*/)) {
          // It's seperate width and height
          imageOptions.width = imageOptions.width || size.replace(/x[0-9]*/, '');
          imageOptions.height = imageOptions.height || size.replace(/[0-9]+x/, '');
        } else {
          // Same size width and height
          imageOptions.width = imageOptions.width || size;
          imageOptions.height = imageOptions.height || size;
        }
      } else delete imageOptions.size;
    }
    linkOptions = geddy.utils.object.merge(linkOptions, { href: link });

    var imageTag = helperUtils.contentTagString('img', source, imageOptions);
    return helperUtils.contentTagString('a', imageTag, linkOptions);
  }
}

/*
 * truncate(string<String>, options<Object>, callback[Function])
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
 *   => 'Once up...''
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
