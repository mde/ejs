Along with flexible template system in Geddy you have access to various built in helpers and custom helpers.

### custom helpers
When you create your application a `helpers` directory will be added to the `app` directory, all the files in this directory will be required when you start the server up.

The exported helpers, are available in your views and throughout your application.

For example, we have this script in a file in our `app/helpers` directory:
```
exports.upperCase = function upperCase(str) {
  return str.toUpperCase();
};
```

Now when we start the server up we can access it in our views by doing:
```
<%= upperCase("some string") %>
// => "SOME STRING"
```
All the exported helpers are global to the templates, so any of them can be accessed from any template.

You can also access them from controllers/models and any other part of your application by using `geddy.viewHelpers` here's an example using our upperCase helper:
```
console.log(geddy.viewHelper.upperCase("some string"));
// => "SOME STRING"
```

* * *

### urlFor
`urlFor(options<String/Object>)`

Returns a URL based on the `options` provided

####Options [String]:
- `'back'` [String] The 'back' string will return a URL that points to the last URL in history

####Options [Object]:
- `relPath` [Boolean] If true, the relative URL is returned(Default: false)
- `protocol` [String] The protocol to use(Default: What your Geddy instance is using('http' default))
- `username` [String] Includes a username in the path. Requires `password` or it'll be ignored
- `password` [String] Includes a username in the path. Requires `password` or it'll be ignored
- `subdomain` [String] Specifies the subdomain to prepend to `domain`
- `domain` [String] Specifies the domain to point to. Required if `relPath` is false
- `host` [String] Alias for `host`
- `port` [Integer] Specify the port to connect to
- `controller` [String] Specifies the controller to use for the path
- `action` [String] Specifies the action to use for the path
- `id` [String] Specifies an ID to use for displaying specific items
- `trailingSlash` [Boolean] If true, adds a trailing slash to the end of the path/domain
- `fragment` [String] Appends a fragment to the end of the path/domain
- `anchor` [String] Alias for `fragment`

####Notes:
- If `options` is a String it will just be returned, unless the String is equal to 'back'
- Any other `options` added will be considered as a query to be appended to the URL

####Examples:
```
urlFor('http://google.com')
// => 'http://google.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com'})
// => 'http://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true})
// => '/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true, trailingSlash: true})
// => '/tasks/new/'


urlFor({host: 'somehost.com', protocol: 'https', username: 'username', password: 'password'})
// => 'https://username:password@somehost.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', protocol: 'https'})
// => 'https://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'edit', id: 'IwTEf55ivH', host: 'somehost.com'})
//  => 'http://somehost.com/tasks/IwTEf55ivH/edit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', anchor: 'submit'})
// => 'http://somehost.com/tasks/new#submit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', authToken: 'some_token'})
// => 'http://somehost.com/tasks/new?authToken=some_token'
```

* * *

### contentTag
`contentTag(tag<String>, content<String>, htmlOptions<Object>)`

Returns an HTML element from a given `tag` and includes the `content` and all `htmlOptions`

####Custom HTML options:
- `data`[Array] The data attribute takes an Array containing data attributes you want, when parsed they each get parsed as a full data attribute(e,g: `data: {goTo: 'google.com'}` will be `data-go-to="google.com"`).

####Examples:
```
contentTag('p', 'this is some content')
// => '<p>this is some content</p>'


contentTag('input', 'sample value')
// => '<input value="sample value" />'


contentTag('input', 'sample value', {value: 'override sample value'})
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('input', 'sample value', {type: 'text', autofocus: true})
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('a', 'http://google.com')
// => '<a href="http://google.com">http://google.com</a>'


contentTag('a', 'hey there', {href: 'http://google.com'})
// => '<a href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data: { goTo: 'http://google.com'} })
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data_go_to: 'http://google.com'})
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'

```

### selectTag
`selectTagString(optionsArray<Array>, selectedOption, htmlOptions<Object>)

Creates a HTML select tag using the given `optionsArray` to create HTML option elements.

`optionsArray` could be an array of strings, numbers or an object with value and text properties to be used for the value attribute and option element content respectively,
along with an `attr` object which will include any other html options. (you can even pass `selected:true` and 'value:VALUE' with the `attr` object as well, but the outer ones, if there is any, will take precedence)

####Examples:
```
selectTag(['geddy', 'alex', 'neil'])
// => '<select><option value="geddy">geddy</option><option value="alex">alex</option><option value="neil">neil</option></select>'

selectTag(['open', 'close'], todo.status, { class:'span6', name:'status' })
// => '<select class="span6" name="status"><option selected="selected" value="open">open</option><option value="close">close</option></select>'

selectTag([{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}], 2)
// => <select><option value="1">Text 1</option><option selected="selected" value="2">Text 2</option></select>

selectTag([{text: "Text 1", attrs: {value: 1, class: 'anoption', data: {thing: 'vip', rate: '0.99'}}}, {value: 2, text: "Text 2", attrs: {value: 0, data: {thing: 'basic'}}}], 2)
// => <select><option data-thing="vip" data-rate="0.99" class="anoption" value="1">Text 1</option><option data-thing="basic" selected="selected" value="2">Text 2</option></select>

```

* * *

### render
`render` is a function that's only available on layout templates. It `render` the template content, which is inserted in the place where the `yield` function is called.

* * *

### partial
`partial(partialURL<String>, data<Object>)`

Partial takes a partialURL which is the location to a partial template and a data object which is the data to render the partial with(params, etc), then it renders the partial and puts the contents in place where the partial function was called.

* * *

### truncate
`truncate(string<String>, options<Integer/Object>)`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The last character will be replaced with an `omission` for a total length not exceeding `length`.

####Options [Integer]:
- If an `options` is an integer it will be assumed that is the desired `length`

####Options [Object]:
- `length [Integer]` Length the output string will be(Default: 30)
- `len [Integer]` Alias for `length`
- `omission [String]` Replace the last letters with an omission(Default: '...')
- `ellipsis [String]` Alias for `omission`
- `seperator [String/RegExp]` Break the truncated text at the nearest `seperator`

####Warnings:
- Please be aware that truncating HTML elements may result in malformed HTML returned. If you'd like safe HTML truncation look at `truncateHTML`

####Examples:
```
runcate('Once upon a time in a world', {length: 10})
// => 'Once up...'


truncate('Once upon a time in a world', {length: 20, omission: '...(continued)'})
// => 'Once u...(continued)'


truncate('Once upon a time in a world', {length: 15, seperator: /\s/})
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('Once upon a time in a world', {length: 15, seperator: ' '})
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('<p>Once upon a time</p>', {length: 20})
// => '<p>Once upon a ti...'
```

* * *

### truncateHTML
`truncateHTML(string<String>, options<Integer/Object>)`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The lat character will be replace with an `omission` for a total length not exceeding `length`. If `once` is true, only the first string in the first HTML element will be truncated leaving others as they were.

####Options [Object]:
- `once`[Boolean] If true only the first string in the first HTML element will be truncated(Default: false)

####Notes:
- All options available to `truncate` are available for `truncateHTML`
- HTML elements are not included with the length of the truncation
- HTML elements will not be truncated, so return value will always be safe for rendering

####Examples:
```
truncateHTML('<p>Once upon a time in a world</p>', {length: 10})
// => '<p>Once up...</p>'


truncateHTML('<p>Once upon a time <small>in a world</small></p>', {length: 10})
// => '<p>Once up...<small>in a wo...</small></p>'


truncateHTML('<p>Once upon a time <small>in a world</small></p>', {length: 10, once: true})
// => '<p>Once up...<small>in a world</small></p>'
```

* * *

### imageLink
`imageLink(source<String>, link<String/Object>, imageOptions<Object>, linkOptions<Object>)`

Returns an anchor element to a given `link` with the given `linkOptions`, with the content being a image element to the given `source` and includes its `imageOptions`

####Notes:
- `linkto` is used on the backend so any `linkOption` will be used for `linkTo`
- `imageTag` is used on the backend as well so any `imageOptions` will be used for `imageTag`

####Examples:
```
imageLink('images/google.png', 'http://google.com')
// => '<a href="http://google.com"><img alt="images/google.png" src="images/google.png" /></a>'


imageLink('images/google.png', 'http://google.com', {alt: ''}
// => '<a href="http://google.com"><img alt="" src="images/google.png" /></a>'


imageLink('images/google.png', 'http://google.com', {alt: '', size: '40x50'})
// => '<a href="http://google.com"><img alt="" height="50" src="images/google.png" width="40" /></a>'
```

* * *

### imageTag
`imageTag(source<String>, htmlOptions<Object>)`

Returns an image tag with the src to a `source` and includes all the given `htmlOptions`

####Custom HTML options:
- `size`[String] Takes a string including the width and height "{width}x{height}"(e,g: '40x50') or it can take a single string included an integer "{size}"(e,g: '40') The first being results in "height='50' width='40'" the second results in the height and width being the same value. _Note_: If the format doesn't comply, it will be ignored

####Examples:
```
imageTag('images/google.png')
// => '<img alt="images/google.png" src="images/google.png" />'


imageTag('images/google.png', {alt: ''})
// => '<img alt="" src="images/google.png" />'


imageTag('images/google.png', {alt: '', size: '40x50'})
// => '<img alt="" height="50" src="images/google.png" width="40" />'


imageTag('images/google.png', {alt: '', size: 'a string'})
// => '<img alt="" src="images/google.png" />'
```

* * *

### styleLink
`styleLink(source<String>, htmlOptions<Object>)`

Generates a style element pointing to `source` and includes all the given `htmlOptions`

####Examples:
```
styleLink('/css/styles.css')
// => '<link href="/css/style.css" />'


styleLink('/css/styles.css', {type: 'text/javascript'})
// => '<link href="/css/style.css" rel="stylesheet" />'
```

* * *

### scriptLink
`scriptLink(source<String>, htmlOptions<Object>)`

Generates a script element pointing to `source` and includes all the given `htmlOptions`

####Examples:
```
scriptLink('/js/script.js')
// => '<script src="/js/script.js"></script>'


scriptLink('/js/script.js', {type: 'text/javascript'})
// => '<script src="/js/script.js" type="text/javascript"></script>'
```

* * *

### linkTo
`linkTo(content<String>, options<String/Object>, htmlOptions<Object>)`

Generates a link from the given `options`, then returns a anchor tag with the `content` and the `htmlOptions` provided

####Notes:
- If you do not want to escape html entities in `content`, set the `_escapeContent` option to false.

####Examples:
```
linkTo('some content', 'http://google.com')
// => '<a href="http://google.com">some content</a>'


linkTo('some content', 'http://google.com', {data: {goTo: 'http://google.com'}})
// => '<a data-go-to="http://google.com" href="http://google.com">some content</a>'

linkTo('Google<sup>TM</sup>', 'http://google.com', {_escapeContent: false})
// => '<a href="http://google.com">Google<sup>TM</sup></a>'

_escapeContent
```

* * *

### urlFor
`urlFor(options<String/Object>)`

Returns a URL based on the `options` provided

####Options [String]:
- `'back'` [String] The 'back' string will return a URL that points to the last URL in history

####Options [Object]:
- `relPath` [Boolean] If true, the relative URL is returned(Default: false)
- `protocol` [String] The protocol to use(Default: What your Geddy instance is using('http' default))
- `username` [String] Includes a username in the path. Requires `password` or it'll be ignored
- `password` [String] Includes a username in the path. Requires `password` or it'll be ignored
- `subdomain` [String] Specifies the subdomain to prepend to `domain`
- `domain` [String] Specifies the domain to point to. Required if `relPath` is false
- `host` [String] Alias for `host`
- `port` [Integer] Specify the port to connect to
- `controller` [String] Specifies the controller to use for the path
- `action` [String] Specifies the action to use for the path
- `id` [String] Specifies an ID to use for displaying specific items
- `trailingSlash` [Boolean] If true, adds a trailing slash to the end of the path/domain
- `fragment` [String] Appends a fragment to the end of the path/domain
- `anchor` [String] Alias for `fragment`

####Notes:
- If `options` is a String it will just be returned, unless the String is equal to 'back'
- Any other `options` added will be considered as a query to be appended to the URL

####Examples:
```
urlFor('http://google.com')
// => 'http://google.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com'})
// => 'http://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true})
// => '/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true, trailingSlash: true})
// => '/tasks/new/'


urlFor({host: 'somehost.com', protocol: 'https', username: 'username', password: 'password'})
// => 'https://username:password@somehost.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', protocol: 'https'})
// => 'https://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'edit', id: 'IwTEf55ivH', host: 'somehost.com'})
//  => 'http://somehost.com/tasks/IwTEf55ivH/edit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', anchor: 'submit'})
// => 'http://somehost.com/tasks/new#submit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', authToken: 'some_token'})
// => 'http://somehost.com/tasks/new?authToken=some_token'
```

* * *

### contentTag
`contentTag(tag<String>, content<String>, htmlOptions<Object>)`

Returns an HTML element from a given `tag` and includes the `content` and all `htmlOptions`

####Custom HTML options:
- `data`[Array] The data attribute takes an Array containing data attributes you want, when parsed they each get parsed as a full data attribute(e,g: `data: {goTo: 'google.com'}` will be `data-go-to="google.com"`).

####Examples:
```
contentTag('p', 'this is some content')
// => '<p>this is some content</p>'


contentTag('input', 'sample value')
// => '<input value="sample value" />'


contentTag('input', 'sample value', {value: 'override sample value'})
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('input', 'sample value', {type: 'text', autofocus: true})
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('a', 'http://google.com')
// => '<a href="http://google.com">http://google.com</a>'


contentTag('a', 'hey there', {href: 'http://google.com'})
// => '<a href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data: { goTo: 'http://google.com'} })
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data_go_to: 'http://google.com'})
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'

```

### selectTag
`selectTagString(optionsArray<Array>, selectedOption, htmlOptions<Object>)`

Creates a HTML select tag using the given `optionsArray` to create HTML option elements.

`optionsArray` could be an array of strings, numbers or an object with value and text properties to be used for the value attribute and option element content respectively.

####Examples:
```
selectTag(['geddy', 'alex', 'neil'])
// => '<select><option value="geddy">geddy</option><option value="alex">alex</option><option value="neil">neil</option></select>'

selectTag(['open', 'close'], todo.status, { class:'span6', name:'status' })
// => '<select class="span6" name="status"><option selected="selected" value="open">open</option><option value="close">close</option></select>'

selectTag([{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}], 2)
// => <select><option value="1">Text 1</option><option selected="selected" value="2">Text 2</option></select>
```

### displayFlash
`displayFlash()`

Displays a small banner automatically for items in the session flash -- e.g., if
in your action you call `this.flash.error('Something went wrong.');` when the
page renders, it will display an error banner with that text.

Support is built in for flash types of `error`, `success`, and `info`.

* * *
