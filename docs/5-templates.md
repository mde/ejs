Geddy's view layer provides a versitile set of templating languages and helpers to get you started quickly.
#### engines
docs coming soon
#### yield
Yield is a function that's only available on layout templates. Yield, yields the template content and is put in place where the yield function is called.
#### partial
`partial(partialURL<String>, data<Object>)`

Partial takes a partialURL which is the location to a partial template and a data object which is the data to render the partial with(params, etc), then it renders the partial and puts the contents in place where the partial function was called.
#### truncate
`truncate(string<String>, options<Integer/Object>)`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The lat character will be replace with an `omission` for a total length not exceeding `length`. 

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
truncate('Once upon a time in a world', { length: 10 })
// => 'Once up...'


truncate('Once upon a time in a world', { length: 20, omission: '...(continued)' })
// => 'Once u...(continued)'


truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
// => 'Once upon a...'
// Normal Output: => 'Once upon a ...'


truncate('<p>Once upon a time</p>', { length: 20 })
// => '<p>Once upon a ti...'
```
#### truncateHTML
docs coming soon
#### imageLink
docs coming soon
#### imageTag
docs coming soon
#### styleLink
docs coming soon
#### scriptLink
docs coming soon
#### linkTo
docs coming soon
#### urlFor
docs coming soon
#### contentTag
docs coming soon
