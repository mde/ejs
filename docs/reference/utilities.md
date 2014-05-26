Geddy provides tons of useful utilities to make tasks easier, they are provided by the `utilities` module in NPM. All the utilities are availble through the `geddy` global object(e.g., `geddy.array.humanize()`).

* * *

#### xml

#### setIndentLevel
`setIndentLevel(level<Number>)`

SetIndentLevel changes the indent level for XML.stringify and returns it

#####Examples
```
setIndentLevel(6)
// => 6
```

* * *

#### stringify
`stringify(obj<Object>, opts<Object>)`

#####Options
- `whitespace` [Boolean] Don't insert indents and newlines after xml entities(Default: true)
- `name` [String] Use custom name as global namespace(Default: typeof obj)
- `fragment` [Boolean] If true no header fragment is added to the top(Default: false)
- `level` [Number] Remove this many levels from the output(Default: 0)
- `arrayRoot` [Boolean] (Default: true)

Stringify returns an XML representation of the given `obj`

#####Examples
```
stringify({user: 'name'})
// => '<?xml version="1.0" encoding="UTF-8"?>\n<object>\n    <user>name</user>\n</object>\n'

stringify(['user'])
// => '<?xml version="1.0" encoding="UTF-8"?>\n<strings type="array">\n    <string>user</string>\n</strings>'

stringify({user: 'name'}, {fragment: true})
// => '<object>\n<user>name</user>\n</object>\n'
```

* * *

#### array

#### humanize
`humanize(array<Array>)`

Creates a string containing the array elements in a readable format

#####Examples
```
humanize(["array", "array", "array"])
// => "array, array and array"

humanize(["array", "array"])
// => "array and array"
```

* * *

#### include
`include(array<Array>, item<Any>)`

Checks if an `item` is included in an `array`

#####Examples
```
include(["array"], "array")
// => true

include(["array"], 'nope')
// => false

include(["array", false], false)
// => true
```

* * *

#### uri

#### getFileExtension
`getFileExtension(path<String>)`

Gets the file extension for a path and returns it

#####Examples
```
getFileExtension('users.json')
// => 'json'
```

* * *

#### paramify
`paramify(obj<Object>, o<Object>)`

#####Options
- `consolidate` [Boolean] take values from elements that can return(Default: false)
- `includeEmpty` [Boolean] include keys in the string for all elements, even(Default: false)
- `snakeize` [Boolean] change param names from camelCase to snake_case.(Default: false)
- `escapeVals` [Boolean] escape the values for XML entities.(Default: false)

Convert a JS Object to a querystring (key=val&key=val). Values in arrays

#####Examples
```
paramify({username: 'user', token: 'token', secret: 'secret'})
// => 'username=user&token=token&secret=secret'

paramify({username: 'user', auth: ['token', 'secret']}, {conslidate: true})
// => 'username=user&auth=token&auth=secret'

paramify({username: 'user', token: ''}, {includeEmpty: true})
// => 'username=user&token='

paramify({username: 'user', token: '<token'}, {escapeVals: true})
// => 'username=user&token=%26lt%3Btoken'
```

* * *

#### objectify
`objectify(str<String>, o<Object>)`

#####Options
- `consolidate` [Boolean] Convert multiple instances of the same(Default: true)

Convert the values in a query string (key=val&key=val) to an Object

#####Examples
```
objectify('name=user')
// => {name: 'user'}

objectify('name=user&name=user2')
// => {name: ['user', 'user2']}

objectify('name=user&name=user2', {consolidate: false})
// => {name: 'user2'}
```

* * *

#### EventBuffer

#### proxyEmit
`proxyEmit(name<String>, args<Array>)`

Emit an event by name and arguments or add it to the buffer if no outlet is set

#####Examples
```
proxyEmit("close")
// => undefined

proxyEmit("data", "some content here")
// => undefined
```

* * *

#### emit
`emit(name<String>, args<Array>)`

Emit an event by name and arguments

#####Examples
```
emit("close")
// => undefined

emit("data", "some content here")
// => undefined
```

* * *

#### sync
`sync(outlet<Object>)`

Flush the buffer and continue piping new events to the outlet

#####Examples
```
sync(new EventEmitter())
// => undefined
```

* * *

#### SortedCollection

#### addItem
`addItem(key<String>, val<Any>)`

Adds a new key/value to the collection

#####Examples
```
addItem('testA', 'AAAA');
// => 'AAAA'

addItem('testV', 'VVVV');
// => 'VVVV'
```

* * *

#### getItem
`getItem(p<String/Number>)`

Retrieves the value for the given identifier that being a key or index

#####Examples
```
getItem('testA');
// => 'AAAA'

getItem(1);
// => 'VVVV'
```

* * *

#### setItem
`setItem(p<String/Number>, val<Any>)`

Sets the item in the collection with the given val, overwriting the existsing item

#####Examples
```
setItem('testA', 'aaaa');
// => 'aaaa'

setItem(1, 'vvvv');
// => 'vvvv'
```

* * *

#### removeItem
`removeItem(p<String/Number>)`

Removes the item for the given identifier

#####Examples
```
removeItem('testA')
// => true

removeItem(3)
// => false
```

* * *

#### getByKey
`getByKey(key<String>)`

Retrieves the value for the given key

#####Examples
```
getByKey('testA');
// => 'AAAA'

getByKey('testV');
// => 'VVVV'
```

* * *

#### setByKey
`setByKey(key<String>, val<Any>)`

Sets a item by key assigning the given val

#####Examples
```
setByKey('testA', 'aaaa');
// => 'aaaa'

setByKey('testV', 'vvvv');
// => 'vvvv'
```

* * *

#### removeByKey
`removeByKey(key<String>)`

Removes a collection item by key

#####Examples
```
removeByKey('testA')
// => true

removeByKey('testC')
// => false
```

* * *

#### getByIndex
`getByIndex(ind<Number>)`

Retrieves the value for the given index

#####Examples
```
getByIndex(0);
// => 'AAAA'

getByIndex(1);
// => 'VVVV'
```

* * *

#### setByIndex
`setByIndex(ind<Number>, val<Any>)`

Sets a item by index assigning the given val

#####Examples
```
setByIndex(0, 'aaaa');
// => 'aaaa'

setByIndex(1, 'vvvv');
// => 'vvvv'
```

* * *

#### removeByIndex
`removeByIndex(ind<Number>)`

Removes a collection item by index

#####Examples
```
removeByIndex(0)
// => true

removeByIndex(3)
// => false
```

* * *

#### hasKey
`hasKey(key<String>)`

Checks if a key item exists in the collection

#####Examples
```
hasKey('testA')
// => true

hasKey('testC')
// => false
```

* * *

#### hasValue
`hasValue(val<Any>)`

Checks if a key item in the collection has a given val

#####Examples
```
hasValue('aaaa')
// => true

hasValue('cccc')
// => false
```

* * *

#### allKeys
`allKeys(str<String>)`

Joins all the keys into a string

#####Examples
```
allKeys(", ")
// => "testA, testV"
```

* * *

#### replaceKey
`replaceKey(oldKey<String>, newKey<String>)`

Joins all the keys into a string

#####Examples
```
replaceKey("testV", "testC")
// => undefined
```

* * *

#### insertAtIndex
`insertAtIndex(ind<Number>, key<String>, val<Any>)`

Inserts a key/value at a specific index in the collection

#####Examples
```
insertAtIndex(1, "testB", "bbbb")
// => true
```

* * *

#### insertAfterKey
`insertAfterKey(refKey<String>, key<String>, val<Any>)`

Inserts a key/value item after the given reference key in the collection

#####Examples
```
insertAfterKey("testB", "testB1", "b1b1b1b1b1b1")
// => true
```

* * *

#### getPosition
`getPosition(key<String>)`

Retrieves the index of the key item

#####Examples
```
getPosition("testA")
// => 0

getPosition("testB1")
// => 2
```

* * *

#### each
`each(func<Function>, opts<Object>)`

#####Options
- `keyOnly` [Boolean] Only give the function the key
- `valueOnly` [Boolean] Only give the function the value

Loops through the collection and calls the given function

#####Examples
```
each(function (val, key) {
  console.log("Key: " + key + " Value: " + val);
})

each(function (key) {
  console.log("Key: " + key);
}, {keyOnly: true})

each(function (val) {
  console.log("Val: " + val);
}, {valueOnly: true})
```

* * *

#### eachKey
`eachKey(func<Function>)`

Loops through the collection and calls the given function

#####Examples
```
each(function (key) {
  console.log("Key: " + key);
}, {keyOnly: true})
```

* * *

#### eachValue
`eachValue(func<Function>)`

Loops through the collection and calls the given function

#####Examples
```
each(function (val) {
  console.log("Val: " + val);
}, {valueOnly: true})
```

* * *

#### clone
`clone()`

Creates a cloned version of the current collection and returns it

#####Examples
```
clone()
// => SortedCollection
```

* * *

#### concat
`concat(hNew<Object>)`

Join a given collection with the current one

#####Examples
```
concat(new SortedCollection())
// => undefined
```

* * *

#### push
`push(key<String>, val<Any>)`

Appends a new item to the collection

#####Examples
```
push("testZ", "zzzz")
// => 5
```

* * *

#### pop
`pop()`

Pops off the last item in the collection and returns it's value

#####Examples
```
pop()
// => "zzzz"
```

* * *

#### unshift
`unshift(key<String>, val<Any>)`

Prepends a new item to the beginning of the collection

#####Examples
```
unshift("testA0", "a0a0a0a0")
// => 6
```

* * *

#### shift
`shift()`

Removes the first item in the list and returns it's value

#####Examples
```
shift()
// => "a0a0a0a0"
```

* * *

#### splice
`splice(index<Number>, numToRemove<Number>, hash<Object>)`

Removes items from index to the given max and then adds the given collections items

#####Examples
```
splice(2, 1, new SortedCollection())
// => undefined
```

* * *

#### reverse
`reverse()`

Reverse the collection item list

#####Examples
```
reverse()
// => undefined
```

* * *

#### date

#### supportedFormats
`supportedFormats`

Object of supported strftime formats

* * *

#### getSupportedFormats
`getSupportedFormats()`

return the list of formats in a string

#####Examples
```
getSupportedFormats()
// => "aAbhBcCdDefFgGHI..."
```

* * *

#### strftime
`strftime(dt<Date>, format<String>)`

Formats the given date with the strftime formated

#####Examples
```
strftime(new Date(), "%w")
// => 3
```

* * *

#### calcCentury
`calcCentury(year<Number>)`

Find the century for the given `year`

#####Examples
```
calcCentury()
// => "21"

calcCentury(2000)
// => "20"
```

* * *

#### calcDays
`calcDays(dt<Date>)`

Calculate the day number in the year a particular date is on

#####Examples
```
calcDays(new Date())
// => 150
```

* * *

#### getMeridiem
`getMeridiem(h<Number>)`

Return 'AM' or 'PM' based on hour in 24-hour format

#####Examples
```
getMeridiem(14)
// => "PM"

getMeridiem(7)
// => "AM"
```

* * *

#### hrMil2Std
`hrMil2Std(hour<String>)`

Convert a 24-hour formatted hour to 12-hour format

#####Examples
```
hrMil2Std("14")
// => 2

hrMil2Std("7")
// => 7
```

* * *

#### hrStd2Mil
`hrStd2Mil(hour<String>, pm<Boolean>)`

Convert a 12-hour formatted hour with meridian flag to 24-hour format

#####Examples
```
hrStd2Mil("7", true)
// => 14

hrStd2Mil("7")
// => 7
```

* * *

#### add
`add(dt<Date>, interv<String>, incr<Number>)`

Add to a Date in intervals of different size, from milliseconds to years

#####Examples
```
add(new Date(), "hour", 1)
// => Date

add(new Date(), "minute", 10)
// => Date
```

* * *

#### diff
`diff(date1<Date>, date2<Date>, interv<String>)`

Get the difference in a specific unit of time (e.g., number of months, weeks, days, etc.) between two dates.

#####Examples
```
diff(new Date(), new Date(), "hour")
// => 0

diff(new Date(), new Date(), "minute")
// => 0
```

* * *

#### parse
`parse(val<String>)`

Convert various sorts of strings to JavaScript Date objects

#####Examples
```
parse("12:00 March 5 1950")
// => Sun Mar 05 1950 12:00:00 GMT-0500 (EST)
```

* * *

#### relativeTime
`relativeTime(dt<Date>, opts<Object>)`

#####Options
- `abbreviated` [Boolean] Use short strings(Default: false)

Convert a Date to an English sentence representing

#####Examples
```
relativeTime(new Date())
// => 'less than a minute ago'
```

* * *

#### toISO8601
`toISO8601(dt<Date>)`

Convert a Date to an ISO8601-formatted string

#####Examples
```
toISO8601(new Date())
// => '2012-10-17T17:57:03.892-04'
```

* * *

#### object

#### merge
`merge(object<Object>, otherObject<Object>)`

Merge merges `otherObject` into `object` and takes care of deep merging of objects

#####Examples
```
merge({user: 'geddy'}, {key: 'key'})
// => {user: 'geddy', key: 'key'}

merge({user: 'geddy', key: 'geddyKey'}, {key: 'key'})
// => {user: 'geddy', key: 'key'}
```

* * *

#### reverseMerge
`reverseMerge(object<Object>, defaultObject<Object>)`

ReverseMerge merges `object` into `defaultObject`

#####Examples
```
reverseMerge({user: 'geddy'}, {key: 'key'})
// => {user: 'geddy', key: 'key'}

reverseMerge({user: 'geddy', key: 'geddyKey'}, {key: 'key'})
// => {user: 'geddy', key: 'geddyKey'}
```

* * *

#### isEmpty
`isEmpty(object<Object>)`

isEmpty checks if an Object is empty

#####Examples
```
isEmpty({user: 'geddy'})
// => false

isEmpty({})
// => true
```

* * *

#### toArray
`toArray(object<Object>)`

Converts an object to an array of objects each including the original key/value

#####Examples
```
toArray({user: 'geddy'})
// => [{key: 'user', value: 'geddy'}]
```

* * *

#### network

#### isPortOpen
`isPortOpen(port<Number>, host<String>, callback<Function>)`

Checks if the given port in the given host is open

#####Examples
```
isPortOpen(3000, 'localhost', function (err, isOpen) {
  if (err) { throw err; }

  console.log(isOpen)
})
```

* * *

#### request

#### request
`request(opts<Object>, callback<Function>)`

Sends requests to the given url sending any data if the method is POST or PUT

#####Options
- `url` [String] The URL to send the request to
- `method` [String] The method to use for the request(Default: 'GET')
- `headers` [Object] Headers to send on requests
- `data` [String] Data to send on POST and PUT requests
- `dataType` [String] The type of data to send

#####Examples
```
// 'GET' request
request({url: 'google.com', method: 'GET'}, function (err, data) {
  if (err) { throw err; }

  console.log(data)
})

// 'POST' request
request({url: 'google.com', data: geddy.uri.paramify({name: 'geddy', key: 'geddykey'}), headers: {'Content-Type': 'application/x-www-form-urlencoded'}, method: 'POST' }, function (err, data) {
  if (err) { throw err; }

  console.log(data)
})
```

* * *

#### inflection

#### inflections
`inflections`

A list of rules and replacements for different inflection types

* * *

#### parse
`parse(type<String>, word<String>)`

Parse a word from the given inflection type

#####Examples
```
parse('plurals', 'carrier')
// => 'carriers'

parse('singulars', 'pluralities')
// => 'plurality'
```

* * *

#### pluralize
`pluralize(word<String>)`

Create a plural inflection for a word

#####Examples
```
pluralize('carrier')
// => 'carriers'
```

* * *

#### singularize
`singularize(word<String>)`

Create a singular inflection for a word

#####Examples
```
singularize('pluralities')
// => 'plurality'
```

* * *

#### file

#### cpR
`cpR(fromPath<String>, toPath<String>, opts<Object>)`

#####Options
- `silent` [Boolean] If false then will log the command

Copies a directory/file to a destination

#####Examples
```
cpR('path/to/directory', 'destination/path')
// => undefined
```

* * *

#### mkdirP
`mkdirP(dir<String>, mode<Number>)`

Create the given directory(ies) using the given mode permissions

#####Examples
```
mkdirP('dir', 0755)
// => undefined

mkdirP('recursive/dirs')
// => undefined
```

* * *

#### readdirR
`readdirR(dir<String>, opts<Object>)`

#####Options
- `format` [String] Set the format to return(Default: Array)

Reads the given directory returning it's contents

#####Examples
```
readdirR('dir')
// => ['dir', 'item.txt']

readdirR('path/to/dir')
// => ['path/to/dir', 'path/to/dir/item.txt']
```

* * *

#### rmRf
`rmRf(p<String>, opts<Object>)`

#####Options
- `silent` [String] If false then logs the command

Deletes the given directory/file

#####Examples
```
rmRf('file.txt')
// => undefined
```

* * *

#### isAbsolute
`isAbsolute(p<String>)`

Checks if a given path is absolute or relative

#####Examples
```
isAbsolute('/path/to/file.txt')
// => true

isAbsolute('C:\\path\\to\\file.txt')
// => true
```

* * *

#### absolutize
`absolutize(p<String>)`

Returns the absolute path for the given path

#####Examples
```
absolutize(path/to/dir)
// => /home/user/path/to/dir
```

* * *

#### searchParentPath
`searchParentPath(p<String>, callback<Function>)`

Search for a directory/file in the current directory and parent directories

#####Examples
```
searchParentPath('path/to/file.txt', function (err, path) {
  if (err) { throw err; }

  console.log(path)
})
```

* * *

#### watch
`watch(path<String>, callback<Function>)`

Watch a given path then calls the callback once a change occurs

#####Examples
```
watch('path/to/dir', function (currStat, oldStat) {
  console.log('the current mtime is: ' + currStat.mtime);
  console.log('the previous mtime was: ' + oldStat.mtime);
})
```

* * *

#### requireLocal
`requireLocal(module<String>, message<String>)`

Require a local module from the node_modules in the current directory

#####Examples
```
requireLocal('utilities', 'optional error message')
// => { ... }
```

* * *

#### string

#### escapeRegExpChars
`escapeRegExpChars(string<String>)`

Escapes regex control-characters in strings used to build regexes dynamically

#####Examples
```
escapeRegExpChars('/\s.*/')
// => '\\\\/s\\\\.\\\\*\\\\/'
```

* * *

#### toArray
`toArray(string<String>)`

Converts a string to an array

#####Examples
```
toArray('geddy')
// => ['g', 'e', 'd', 'd', 'y']
```

* * *

#### reverse
`reverse(string<String>)`

Reverses a string

#####Examples
```
reverse('geddy')
// => 'yddeg'
```

* * *

#### ltrim
`ltrim(string<String>, char<String>)`

Ltrim trims `char` from the left of a `string` and returns it if no `char` is given it will trim spaces

#####Examples
```
ltrim('&geddy', '&')
// => 'geddy'

ltrim('    geddy')
// => 'geddy'
```

* * *

#### rtrim
`rtrim(string<String>, char<String>)`

Rtrim trims `char` from the right of a `string` and returns it if no `char` is given it will trim spaces

#####Examples
```
rtrim('geddy&', '&')
// => 'geddy'

rtrim('geddy    ')
// => 'geddy'
```

* * *

#### trim
`trim(string<String>, char<String>)`

Trim trims `char` from the left and right of a `string` and returns it if no `char` is given it will trim spaces

#####Examples
```
trim('&&&&geddy&', '&')
// => 'geddy'

trim('    geddy    ')
// => 'geddy'
```

* * *

#### chop
`chop(string<String>)`

Returns a new String with the last character removed. If the string ends with \r\n, both characters are removed. Applying chop to an empty string returns an empty string.

#####Examples
```
chop('geddy&')
// => 'geddy'
```

* * *

#### lpad
`lpad(string<String>, char<String>, width<Number>)`

Lpad adds `char` to the left of `string` until the length of `string` is more than `width`

#####Examples
```
lpad('geddy', '&', 6)
// => '&geddy'
```

* * *

#### rpad
`rpad(string<String>, char<String>, width<Number>)`

Rpad adds `char` to the right of `string` until the length of `string` is more than `width`

#####Examples
```
rpad('geddy', '&', 7)
// => 'geddy&'
```

* * *

#### pad
`pad(string<String>, char<String>, width<Number>)`

Pad adds `char` to the left and right of `string` until the length of `string` is more than `width`

#####Examples
```
rpad('geddy', '&', 6)
// => '&geddy&'
```

* * *

#### truncate
`truncate(string<String>, options<Integer/Object>, callback<Function>)`

#####Options
- `length` [Integer] Length the output string will be(Default: string.length)
- `len` [Integer] Alias for `length`
- `omission` [String] Replace last characters with an omission(Default: '...')
- `ellipsis` [String] Alias for `omission`(Default: '...')
- `seperator` [String/RegExp] Break the truncated test at the nearest `seperator`

Truncates a given `string` after a specified `length` if `string` is longer than `length`. The last characters will be replaced with an `omission` for a total length not exceeding `length`. If `callback` is given it will fire if `string` is truncated.

#####Examples
```
truncate('Once upon a time in a world', { length: 10 })
// => 'Once up...'

truncate('Once upon a time in a world', { length: 10, omission: '///' })
// => 'Once up///'

truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
// => 'Once upon a...'

truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
// => 'Once upon a...'

truncate('<p>Once upon a time in a world</p>', { length: 20 })
// => '<p>Once upon a ti...'
```

* * *

#### truncateHTML
`truncateHTML(string<String>, options<Integer/Object>, callback<Function>)`

#####Options
- `once` [Boolean] If true, it will only be truncated once, otherwise the(Default: false)

Truncates a given `string` inside HTML tags after a specified `length` if string` is longer than `length`. The last characters will be replaced with an `omission` for a total length not exceeding `length`. If `callback` is given it will fire if `string` is truncated. If `once` is true only the first string in the first HTML tags will be truncated leaving the others as they were

#####Examples
```
truncateHTML('<p>Once upon a time in a world</p>', { length: 10 })
// => '<p>Once up...</p>'

truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 })
// => '<p>Once up...<small>in a wo...</small></p>'

truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true })
// => '<p>Once up...<small>in a world</small></p>'
```

* * *

#### nl2br
`nl2br(string<String>)`

Nl2br returns a string where all newline chars are turned into line break HTML tags

#####Examples
```
nl2br("geddy\n")
// => 'geddy<br />'
```

* * *

#### snakeize
`snakeize(string<String>, separ='_'<String>)`

Snakeize converts camelCase and CamelCase strings to snake_case strings

#####Examples
```
snakeize("geddyJs")
// => 'geddy_js'

snakeize("GeddyJs")
// =>  'geddy_js'
```

* * *

#### camelize
`camelize(string<String>, options<Object>)`

#####Options
- `initialCap` [Boolean] If initialCap is true the returned
- `leadingUnderscore` [Boolean] If leadingUnderscore os true then if

Camelize takes a string and optional options and returns a camelCase version of the given `string`

#####Examples
```
camelize("geddy_js")
// => 'geddyJs'

camelize("geddy_js", {initialCap: true})
// => 'GeddyJs'

camelize("geddy_js", {leadingUnderscore: true})
// => 'geddyJs'

camelize("_geddy_js", {leadingUnderscore: true})
// => '_geddyJs'
```

* * *

#### decapitalize
`decapitalize(string<String>)`

Decapitalize returns the given string with the first letter uncapitalized.

#####Examples
```
decapitalize("Geddy")
// => 'geddy'
```

* * *

#### capitalize
`capitalize(string<String>)`

capitalize returns the given string with the first letter capitalized.

#####Examples
```
decapitalize("geddy")
// => 'Geddy'
```

* * *

#### dasherize
`dasherize(string<String>, replace='-'<String>)`

Dasherize returns the given `string` converting camelCase and snakeCase to dashes or replace them with the `replace` character.

#####Examples
```
dasherize("geddyJs")
// => 'geddy-js'

dasherize("geddyJs", "_")
// => 'geddy_js'
```

* * *

#### include
`include(searchIn<String>, searchFor<String>)`

Searches for a particular string in another string

#####Examples
```
include('geddy', 'js')
// => false

include('geddyjs', 'js')
// => true
```

* * *

#### getInflections
`getInflections(string<String>, options<Object>)`

#####Options
- `initialCap` [Boolean]

Inflection returns an object that contains different inflections created from the given `name`

#####Examples
```
getInflections('user')
// => {filename: { ... }, constructor: { ... }, property: { ... }}
```
