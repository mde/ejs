Geddy's view layer provides a versatile set of templating languages and helpers to get you started quickly.

* * *

#### engines
The view layer supports these four templating engines:

+ EJS(.ejs)
+ Jade(.jade)
+ Mustache(.mu, .ms, .mustache)
+ Handlebars(.hbs, .handlebars)
+ [Swig](http://paularmstrong.github.io/swig/)(.swig)

To use a certain template engine just give the view a corresponding extension listed above.

When using the Geddy CLI to generate parts of your application you can use different template languages by giving an argument to the command, here are some examples:

```
$ geddy app --mustache my_app
$ geddy scaffold -m user


$ geddy app --jade my_app
$ geddy scaffold -j user


$ geddy app --handle my_app
$ geddy scaffold -H user

$ geddy app --swig my_app
$ geddy scaffold --swig user
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

#### contentTag
`contentTag(tag<String>, content<String>, htmlOptions<Object>)`

Returns an HTML element from a given `tag` and includes the `content` and all `htmlOptions`

#####Custom HTML options:
- `data`[Array] The data attribute takes an Array containing data attributes you want, when parsed they each get parsed as a full data attribute(e,g: `data: {goTo: 'google.com'}` will be `data-go-to="google.com"`).

#####Examples:
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

#### selectTag
`selectTagString(optionsArray<Array>, selectedOption, htmlOptions<Object>)

Creates a HTML select tag using the given `optionsArray` to create HTML option elements. 

`optionsArray` could be an array of strings, numbers or an object with value and text properties to be used for the value attribute and option element content respectively. 

#####Examples:
```
selectTag(['geddy', 'alex', 'neil'])
// => '<select><option value="geddy">geddy</option><option value="alex">alex</option><option value="neil">neil</option></select>'

selectTag(['open', 'close'], todo.status, { class:'span6', name:'status' })
// => '<select class="span6" name="status"><option selected="selected" value="open">open</option><option value="close">close</option></select>'

selectTag([{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}], 2)
// => <select><option value="1">Text 1</option><option selected="selected" value="2">Text 2</option></select>
```

* * *

>>>>>>> v0.7
