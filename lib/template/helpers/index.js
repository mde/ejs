/**
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
var utils = require('utilities')
  , helperUtils = require('./utils')
  , flashUtils = require('./flash')
  , Data;

/**
  @name helpers
  @namespace helpers
*/

// Copy a data object so it can be used in helpers
exports.registerData = {
  name: 'registerData',
  action: function (data) {
    Data = data;
    helperUtils.registerData(data);
  }
}

/***
  @name helpers#urlFor
  @public
  @function
  @return {String} A path of the URL is returned
  @description Returns a URL based on the `options` provided
  @param {String/Object} options
    @param {String} [options] Simply returns the string, unless the string is `back`
                                      then a link to the previous url is returned
    @param {Boolean} [options.relpath=false] If true, the relative URL is returned
    @param {String} [options.protocol] The protocol to use(Uses Geddy's current protocol('http' default))
    @param {String} [options.username] Includes a username in the path. Requires `password` or
                                       it'll be ignored
    @param {String} [options.password] Includes a password in the path. Requires `username` or
                                       it'll be ignored
    @param {String} [options.subdomain] Specify a subdomain to prepend to `domain`
    @param {String} [options.domain] Specify a domain to use. Required if `relPath` is false(Uses
                                     Geddy's `hostname` option as default)
    @param {String} [options.host] Alias for `domain`
    @param {Integer} [options.port] Specify a port to connect to
    @param {String} [options.controller] Specify the controller to use for the path(Uses the current
                                         controller, but only if `action` or `id` are also being used)
    @param {String} [options.action] Specify the action to use for the path(Uses the index action if
                                     a `controller` and no `id` is given, uses the show action if
                                     a `id` action is given but no `action` option)
    @param {String} [options.id] Specify an ID to use for the path
    @param {Boolean} [options.trailingSlash=false] If true, a "/" will be appended to the end of the path
    @param {String} [options.fragment] Appends a fragment to the end of the path e,g: "#string"
    @param {String} [options.anchor] Alias for `fragment`
*/
exports.urlFor = {
  name: 'urlFor',
  action: function (options) {
    return helperUtils.urls.urlFor(options);
  }
}

/**
  @name helpers#contentTag
  @public
  @function
  @return {String} A HTML `tag` with the given `content` and `htmlOptions`
  @description Creates a HTML tag with all the give options
  @param {String} tag The HTML tag to use, safe to use any tag with this
  @param {String} content The content to use with the tag, if it's a self closing tag
                  special cases will be used for content e,g: 'src' attribute is content for images
  @param {Object} htmlOptions Includes any HTML attribute you want to include
*/
exports.contentTag = {
  name: 'contentTag',
  action: function (tag, content, htmlOptions) {
    return helperUtils.tags.contentTagString(tag, content, htmlOptions);
  }
}

/**
  @name helpers#selectTag
  @public
  @function
  @return {String} A HTML `select tag` with the given `optionsArray` and `htmlOptions`
  @description Creates a HTML select tag using the given `optionsArray` to create HTML option elements.
    Example: selectTag(['open', 'close'], todo.status, { class:'span6', name:'status' })
  @param {Array} optionsArray The array options used to generate the tag elements.
    It could be an array of strings, numbers or an object with value and text properties to be used
    for the value attribute and option element content respectively.
  @param {String} selectedOption optionally specify the selected option
  @param {Object} htmlOptions Includes any HTML attribute you want to include in the select tag
*/
exports.selectTag = {
  name: 'selectTag',
  action: function (optionsArray, selectedOption, htmlOptions) {
    return helperUtils.tags.selectTagString(optionsArray, selectedOption, htmlOptions);
  }
}

/**
  @name helpers#linkTo
  @public
  @function
  @return {String} A HTML tag with a link to `options`
  @description Creates a HTML tag that links to `options` with `content` as the content and includes
               the given `htmlOptions`
  @param {String} content The content to include for the link
  @param {String/Object} options Creates the URL to link to, look at `urlFor` for more details
  @param {Object} htmlOptions Includes any HTML attribute you want to include
*/
exports.linkTo = {
  name: 'linkTo',
  action: function (content, options, htmlOptions) {
    var opts = options || {}
      , htmlOpts = htmlOptions || {}
      , url;

    // This is for imageLink to avoid escaping
    // FIXME: Kinda stupid putting this in htmlOptions, but options is taken.
    if(htmlOpts._escapeContent !== false) {
      content = utils.string.escapeXML(content);

      delete htmlOpts._escapeContent;
    }

    // If options is a function, assume it was from a action helper
    if (typeof opts === 'function') {
      opts = String(opts());
    }
    url = exports.urlFor.action(opts);

    htmlOpts.href = htmlOpts.href || url;

    return exports.contentTag.action('a', content, htmlOpts);
  }
};

/**
  @name helpers#scriptLink
  @public
  @function
  @return {String} A HTML script tag pointing to `source`
  @description Creates a HTML script tag pointing to `source` with all the give `htmlOptions`
  @param {String} source The URL to point to
  @param {Object} htmlOptions Includes any HTML attribute you want to include
*/
exports.scriptLink = {
  name: 'scriptLink',
  action: function (source, htmlOptions) {
    htmlOptions = htmlOptions || {};
    htmlOptions = utils.mixin({ src: source }, htmlOptions)

    return exports.contentTag.action('script', '', htmlOptions);
  }
};

/**
  @name helpers#styleLink
  @public
  @function
  @return {String} A HTML link tag pointing to `source`
  @description Creates a HTML link tag pointing to `source` with all the give `htmlOptions`
  @param {String} source The URL to point to
  @param {Object} htmlOptions Includes any HTML attribute you want to include
*/
exports.styleLink = {
  name: 'styleLink',
  action: function (source, htmlOptions) {
    htmlOptions = htmlOptions || {};

    return exports.contentTag.action('link', source, htmlOptions);
  }
};

/**
  @name helpers#imageTag
  @public
  @function
  @return {String} A HTML img tag pointing to `source`
  @description Creates a HTML img tag pointing to `source` with all the give `htmlOptions`
  @param {String} source The image URL
  @param {Object} htmlOptions Includes any HTML attribute you want to include
    @param {String} size Creates a width and height from the given size, the style must be in the
                         format "{width}x{height}"(e,g: '40x50') or simply a single size(uses the
                         size as both width and height.) if the size doesn't follow either format
                         it'll be ignored
*/
exports.imageTag = {
  name: 'imageTag',
  action: function (source, htmlOptions) {
    htmlOptions = htmlOptions || {};

    // If size option is included
    if('size' in htmlOptions) {
      var size = htmlOptions.size
        , pat = /([0-9]+x[0-9]*|[0-9]+)/;

      if (size.match(pat)) {
        delete htmlOptions.size;

        if (size.match(/[0-9]+x[0-9]*/)) {
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

/**
  @name helpers#imageLink
  @public
  @function
  @return {String} A HTML link tag pointing to `link` with the content as the image in `source`
  @description Creates a HTML link tag pointing to `link` with all the give `linkOptions` and includes
               the content as the image from `source` and it's `imageOptions`
  @param {String} source The image URL
  @param {String} link the URL to point to
  @param {Object} imageOptions Includes any HTML attribute you want to include(Supports the `size`
                               option availble in `imageTag`)
  @param {Object} linkOptions Includes any HTML attribute you want to include
*/
exports.imageLink = {
  name: 'imageLink',
  action: function (source, link, imageOptions, linkOptions) {
    imageOptions = imageOptions || {};
    linkOptions = linkOptions || {};

    // If link is a function, assume it was from a action helper
    if (typeof link === 'function') {
      link = String(link());
    }
    linkOptions = utils.object.merge(linkOptions, { href: link });
    linkOptions._escapeContent = false;

    var imageTag = exports.imageTag.action(source, imageOptions);
    return exports.linkTo.action(imageTag, link, linkOptions)
  }
}

// Docs at utils.string.truncate
exports.truncate = {
  name: 'truncate',
  action: utils.string.truncate
};

// Docs at utils.string.truncateHTML
exports.truncateHTML = {
  name: 'truncateHTML',
  action: utils.string.truncateHTML
};

exports.displayFlash = {
  name: 'displayFlash'
, action: flashUtils.displayFlash
};

exports.t = {
  name: 't'
, action: function () {
    var i18n = this.i18n;
    return i18n.t.apply(i18n, arguments);
  }
};
