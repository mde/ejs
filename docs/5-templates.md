Geddy's view layer provides a versatile set of templating languages and helpers to get you started quickly.

* * *

#### engines
The view layer supports these four templating engines:

+ EJS
+ Jade
+ Mustache
+ Handlebars

To use them, just give your template the correct file extension. If you'd like to use a different templating engine when generating an app or scaffolds, use the corresponding command line option:

```
$ geddy app --mustach my_app
$ geddy scaffold --mustache user


$ geddy app --jade my_app
$ geddy scaffold --jade user


$ geddy app --handle my_app
$ geddy scaffold --handle user
```

* * *

#### yield
Yield is a function that's only available on layout templates. It yields the template content, which is inserted in th place where the yield function is called.

* * *

#### partial
`partial(partialURL<String>, data<Object>)`

Partial takes a partialURL which is the location to a partial template and a data object which is the data to render the partial with(params, etc), then it renders the partial and puts the contents in place where the partial function was called.

* * *

#### truncate
`truncate(string<String>, options<Integer/Object>)`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The last character will be replace with an `omission` for a total length not exceeding `length`.

#####Options [Integer]:
- If an `options` is an integer it will be assumed that is the desired `length`

#####Options [Object]:
- `length [Integer]` Length the output string will be(Default: 30)
- `len [Integer]` Alias for `length`
- `omission [String]` Replace the last letters with an omission(Default: '...')
- `ellipsis [String]` Alias for `omission`
- `seperator [String/RegExp]` Break the truncated text at the nearest `seperator`

#####Warnings:
- Please be aware that truncating HTML elements may result in malformed HTML returned. If you'd like safe HTML truncation look at `truncateHTML`

#####Examples:
```
truncate('Once upon a time in a world', {length: 10 })
// => 'Once up...'


truncate('Once upon a time in a world', {length: 20, omission: '...(continued)' })
// => 'Once u...(continued)'


truncate('Once upon a time in a world', {length: 15, seperator: /\s/ })
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('Once upon a time in a world', {length: 15, seperator: ' ' })
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('<p>Once upon a time</p>', {length: 20 })
// => '<p>Once upon a ti...'
```

* * *

#### truncateHTML
`truncateHTML(string<String>, options<Integer/Object>)`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The lat character will be replace with an `omission` for a total length not exceeding `length`. If `once` is true, only the first string in the first HTML element will be truncated leaving others as they were.

#####Options [Object]:
- `once`[Boolean] If true only the first string in the first HTML element will be truncated(Default: false)

#####Notes:
- All options available to `truncate` are available for `truncateHTML`
- HTML elements are not included with the length of the truncation
- HTML elements will not be truncated, so return value will always be safe for rendering

#####Examples:
```
truncateHTML('<p>Once upon a time in a world</p>', {length: 10 })
// => '<p>Once up...</p>'


truncateHTML('<p>Once upon a time <small>in a world</small></p>', {length: 10 })
// => '<p>Once up...<small>in a wo...</small></p>'


truncateHTML('<p>Once upon a time <small>in a world</small></p>', {length: 10, once: true })
// => '<p>Once up...<small>in a world</small></p>'
```

* * *

#### imageLink
`imageLink(source<String>, link<String/Object>, imageOptions<Object>, linkOptions<Object>)`

Returns an anchor element to a given `link` with the given `linkOptions`, with the content being a image element to the given `source` and includes its `imageOptions`

#####Notes:
- `linkto` is used on the backend so any `linkOption` will be used for `linkTo`
- `imageTag` is used on the backend as well so any `imageOptions` will be used for `imageTag`

#####Examples:
```
imageLink('images/google.png', 'http://google.com')
// => '<a href="http://google.com"><img alt="images/google.png" src="images/google.png" /></a>'


imageLink('images/google.png', 'http://google.com', {alt: '' }
// => '<a href="http://google.com"><img alt="" src="images/google.png" /></a>'


imageLink('images/google.png', 'http://google.com', {alt: '', size: '40x50' })
// => '<a href="http://google.com"><img alt="" height="50" src="images/google.png" width="40" /></a>'
```

* * *

#### imageTag
`imageTag(source<String>, htmlOptions<Object>)`

Returns an image tag with the src to a `source` and includes all the given `htmlOptions`

#####Custom HTML options:
- `size`[String] Takes a string including the width and height "{width}x{height}"(e,g: '40x50') or it can take a single string included an integer "{size}"(e,g: '40') The first being results in "height='50' width='40'" the second results in the height and width being the same value. _Note_: If the format doesn't comply, it will be ignored

#####Examples:
```
imageTag('images/google.png')
// => '<img alt="images/google.png" src="images/google.png" />'


imageTag('images/google.png', {alt: '' })
// => '<img alt="" src="images/google.png" />'


imageTag('images/google.png', {alt: '', size: '40x50' })
// => '<img alt="" height="50" src="images/google.png" width="40" />'


imageTag('images/google.png', {alt: '', size: 'a string' })
// => '<img alt="" src="images/google.png" />'
```

* * *

#### styleLink
`styleLink(source<String>, htmlOptions<Object>)`

Generates a style element pointing to `source` and includes all the given `htmlOptions`

#####Examples:
```
styleLink('/css/styles.css')
// => '<link href="/css/style.css" />'


styleLink('/css/styles.css', {type: 'text/javascript' })
// => '<link href="/css/style.css" rel="stylesheet" />'
```

* * *

#### scriptLink
`scriptLink(source<String>, htmlOptions<Object>)`

Generates a script element pointing to `source` and includes all the given `htmlOptions`

#####Examples:
```
scriptLink('/js/script.js')
// => '<script src="/js/script.js"></script>'


scriptLink('/js/script.js', {type: 'text/javascript' })
// => '<script src="/js/script.js" type="text/javascript"></script>'
```

* * *

#### linkTo
`linkTo(content<String>, options<String/Object>, htmlOptions<Object>)`

Generates a link from the given `options`, then returns a anchor tag with the `content` and the `htmlOptions` provided

#####Examples:
```
linkTo('some content', 'http://google.com')
// => '<a href="http://google.com">some content</a>'


linkTo('some content', 'http://google.com', {data: {goTo: 'http://google.com'} })
// => '<a data-go-to="http://google.com" href="http://google.com">some content</a>'
```

* * *

#### urlFor
`urlFor(options<String/Object>)`

Returns a URL based on the `options` provided

#####Options [String]:
- `'back'` [String] The 'back' string will return a URL that points to the last URL in history

#####Options [Object]:
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

#####Notes:
- If `options` is a String it will just be returned, unless the String is equal to 'back'
- Any other `options` added will be considered as a query to be appended to the URL

#####Examples:
```
urlFor('http://google.com')
// => 'http://google.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com' })
// => 'http://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true })
// => '/tasks/new'


urlFor({controller: 'tasks', action: 'new', relPath: true, trailingSlash: true })
// => '/tasks/new/'


urlFor({host: 'somehost.com', protocol: 'https', username: 'username', password: 'password' })
// => 'https://username:password@somehost.com'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', protocol: 'https' })
// => 'https://somehost.com/tasks/new'


urlFor({controller: 'tasks', action: 'edit', id: 'IwTEf55ivH', host: 'somehost.com' })
//  => 'http://somehost.com/tasks/IwTEf55ivH/edit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', anchor: 'submit' })
// => 'http://somehost.com/tasks/new#submit'


urlFor({controller: 'tasks', action: 'new', host: 'somehost.com', authToken: 'some_token' })
// => 'http://somehost.com/tasks/new?authToken=some_token'
```

* * *

#### contentTag
`contentTag(tag<String>, content<String>, htmlOptions<Object>)`

Returns an HTML element from a given `tag` and includes the `content` and all `htmlOptions`

#####Custom HTML options:
- `data`[Array] The data attribute takes an Array containing data attributes you want, when parsed they each get parsed as a full data attribute(e,g: `data: {goTo: 'google.com' }` will be `data-go-to="google.com"`).

#####Examples:
```
contentTag('p', 'this is some content')
// => '<p>this is some content</p>'


contentTag('input', 'sample value')
// => '<input value="sample value" />'


contentTag('input', 'sample value', {value: 'override sample value' })
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('input', 'sample value', {type: 'text', autofocus: true })
// => '<input autofocus="autofocus" type="text" value="sample value" />'


contentTag('a', 'http://google.com')
// => '<a href="http://google.com">http://google.com</a>'


contentTag('a', 'hey there', {href: 'http://google.com' })
// => '<a href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data: { goTo: 'http://google.com' } })
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'


contentTag('a', 'hey there', {href: 'http://google.com', data_go_to: 'http://google.com' })
// => '<a data-go-to="http://google.com" href="http://google.com">hey there</a>'
```

* * *

