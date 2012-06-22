
// List of HTML attributes that take boolean values
exports.boolAttributes = [
  'disabled', 'readonly', 'multiple', 'checked',
  'autobuffer', 'autoplay', 'controls',
  'loop', 'selected', 'hidden', 'scoped',
  'async', 'defer', 'reversed', 'ismap', 'seemless',
  'muted', 'required', 'autofocus', 'novalidate',
  'open', 'pubdate', 'itemscope', 'formnovalidate'
];

// List of HTML tags that are self closing,
// Each item has a value that is the attribute that
// holds the content that's probably the one that should
// be default for content
exports.selfClosingTags = {
  'link': {name: 'link', content: 'src'},
  'meta': {name: 'meta', content: 'content'},
  'img': {name: 'img', content: 'src'},
  // Could be `placeholder` but not all browser support it
  'input': {name: 'input', content: 'value'},
  'area': {name: 'area', content: 'href'},
  'base': {name: 'link', content: 'href'},
  'col': {name: 'col', content: 'title'},
  'frame': {name: 'frame', content: 'src'},
  'param': {name: 'param', content: 'value'}
};

// List of tags that may need some pre content data
exports.preContentStrings = {
  textarea: '\n'
}

/*
 * contentTagString(tag<String>, content<String>, htmlOptions<Object>)
 *
 * Returns a HTML element created from the tag, content and
 * html attributes given
*/
exports.contentTagString = function(tag, content, htmlOptions) {
  if(!tag) return;
  if(!content) content = '';
  htmlOptions = htmlOptions || {};

  var selfClosing = tag in exports.selfClosingTags ? exports.selfClosingTags[tag] : undefined
    , tagOptions;

  if(selfClosing) htmlOptions[selfClosing.content] = htmlOptions[selfClosing.content] || content || false;
  if(tag === 'a') htmlOptions.href = htmlOptions.href || content;
  if(tag === 'img') htmlOptions.alt = htmlOptions.alt === '' ? htmlOptions.alt : htmlOptions.alt || content;
  tagOptions = exports.tagOptions(htmlOptions);

  content = exports.preContentStrings[tag] ?
    exports.preContentStrings[tag] + content :
    content;

  if(selfClosing) {
    return '<'+tag+tagOptions+' />';
  } else {
    return '<'+tag+tagOptions+'>' + content + '</'+tag+'>';
  }
};

/*
 * tagOptions(options<Object>)
 *
 * Returns a string of parsed HTML options sorted alphabetically
*/
exports.tagOptions = function(options) {
  if(!options) return;

  var attrs = []
    , key
    , value
    , i, k;

  // Loop through each option
  for(i in options) {
    key = geddy.utils.string.dasherize(i);
    value = options[i];

    // If it's a data key that has an object
    // loop through each of the values in the object
    // and create data attributes out of them
    if(key === 'data' && typeof value === 'object') {
      for(k in value) {
        attrs.push(exports.dataAttribute(k, value[k]));
      }
    }
    // If the attribute is a boolean attribute
    // parse it as a bool attribute
    else if(geddy.utils.array.included(key, exports.boolAttributes)) {
      if(value) attrs.push(exports.boolAttribute(key));
    }
    // Just a normal attribute, parse it normally
    else if(value || value === '') {
      attrs.push(exports.tagAttribute(key, value))
    }
  }

  if(attrs.length > 0) {
    return ' ' + attrs.sort().join(' ');
  } else return '';
};

/*
 * dataAttribute(attribute<String>, value<String/Boolean>)
 *
 * Returns a parsed HTML data attribute
*/
exports.dataAttribute = function(attribute, value) {
  attribute = 'data-' + geddy.utils.string.dasherize(attribute);

  return exports.tagAttribute(attribute, value);
};

/*
 * boolAttribute(attribute<String>)
 *
 * Returns a parsed HTML boolean attribute
*/
exports.boolAttribute = function(attribute) {
  return attribute + '="' + attribute + '"';
};

/*
 * tagAttribute(attribute<String>)
 *
 * Returns a parsed HTML  attribute
*/
exports.tagAttribute = function(attribute, value) {
  // Only allow Strings to be an object
  if(typeof value === 'object') value = value.join(' ');

  return attribute + '="' + value + '"';
};
