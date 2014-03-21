/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var fs = require('fs')
  , path = require('path')
  , md = require('marked')
  , hljs = require('highlight.js')
  , TOC = function (parent, text) {
      this.parent = parent;
      this.text = text;
      this.name = null;
      this.children = [];
      if (parent) {
        parent.children.push(this);
      };
    }
  , _processContent = function (d) {
      var content
        , lines = d.split('\n')
        , sections = []
        , data = []
        , currentLength = 0
        , currentObj = new TOC()
       , topObj = currentObj;

      lines.forEach(function (line) {
        var s
          , t
          , n
          , match
          , pat = /^#{2,4}[^#]/ // Grab h2, h3
          , diff;

        // Found a header line
        if ((match = pat.exec(line))) {
          // Is this a different header level?
          diff = currentLength - match[0].length;
          // Title, trim pounds and spaces
          t = geddy.string.trim(line.replace(pat, ''));
          // Name for anchor-nav, spaces will break anchor name in Firefox
          // Snakeize method-names, strip dots
          n = geddy.string.snakeize(t.replace(/ /g, '_').replace(/\./, ''));
          // If more pound signs, we're descending into children
          if (diff < 0) {
            s = new TOC(currentObj, t);
          }
          // Fewer pound signs, we're going up to next sibling of parent
          else if (diff > 0) {
            // Go up the number of levels of difference in length
            var diff = currentLength - match[0].length
              , parentObj;
            while (diff > -1) {
              parentObj = currentObj.parent;
              currentObj = parentObj;
              diff--;
            }
            s = new TOC(parentObj, t);
          }
          // Same number, next sibling
          else {
            s = new TOC(currentObj.parent, t);
          }
          currentObj = s;
          // Namespace the name of the new TOC object with parent's
          n = s.parent && s.parent.name ? s.parent.name + '_' + n : n;
          s.name = n;
          // Insert a named anchor tag just before the header
          data.push('<a name="' + n + '"></a>');
          currentLength = match[0].length;
        }
        data.push(line);
      });
      content = md(data.join('\n'));
      return {
        content: content
      , toc: topObj
      };
    };


var BRANCH = 'v0.12'
  , URL_PREFIX = 'https://raw.github.com/geddy/geddy/' +
        BRANCH + '/'
  // If set to true, uses the local copy on the filesystem
  // Use for development work
  , USE_LOCAL = false;

md.setOptions({
  gfm: true
, pedantic: false
, highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  }
});

var Main = function () {

  // Utility methods
  // =====================
  // Fetch from either GH or from the local FS inside the repo
  var fetch = function (p, cb) {
        var opts
          , filePath;
        if (USE_LOCAL) {
          filePath = path.join('../', p);
          fs.readFile(filePath, function (err, data) {
            if (err) { throw err; }
            cb(data.toString());
          });
        }
        else {
          opts = {
            url: URL_PREFIX + p
          , headers: {'User-Agent': 'GeddyJS documentation site'}
          , dataType: 'txt'
          };
          geddy.request(opts, function (err, data) {
            if (err) { throw err; }
            cb(data);
          });
        }
      }

    // Get the list of topics either for Ref or Guide
    // Parse the JSON data and return as JS obj
    , getTopicsForDocType = function (docType, callback) {
        fetch('docs/' + docType + '/topics.json', function (data) {
          callback(JSON.parse(data));
        });
      }

    // Get the doc content for a particular topic
    // Convert MD to HTML, return with name and list of subheads
    , getDocForTopic = function (docType, topic, callback) {
        fetch('docs/' + docType + '/' + topic.path + '.md', function (data) {
          var content = data
            , name = topic.name
            , subHeads = []
            , lines = content.split('\n');
          for (var l in lines) {
            if (lines[l].indexOf('#### ') == 0) {
              subHeads.push(geddy.string.trim(lines[l].replace('#### ', '')));
            }
          }
          callback({
            name: name
          , content: content
          , subs: subHeads
          });
        });
      };

  // Cache the response for ref and guide in-process
  this.cacheResponse(['reference', 'guide']);

  this.index = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/index'
    });
  };

  this.documentation = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/documentation'
    });
  };

  var self = this;
  ['reference', 'guide'].forEach(function (docType) {
    self[docType] = function (req, resp, params) {
      var self = this;
      // Get this list of topics, array of obj in the form of
      // {name: 'Foo', path: 'foo'}
      getTopicsForDocType(docType, function (topics) {
        var count = topics.length
          , docs = '';
        // Pull down and format the content for each topic
        topics.forEach(function (t) {
          getDocForTopic(docType, t, function (content) {
            var aggregated;
            //docs.push(content);
            docs += '### ' + content.name + '\n';
            docs += content.content + '\n';
            count--;
            // Render when they're all assembled
            if (count == 0) {
              var processed = _processContent(docs);
              self.respond(processed, {
                format: 'html'
              , template: 'app/views/main/' + docType
              });
            }
          });
        });
      });

    };
  });

  this.tutorial = function (req, resp, params) {
    var self = this;
    fetch('tutorial.md', function (data) {
      var processed = _processContent(data);
      self.respond(processed, {
        format: 'html'
      , template: 'app/views/main/tutorial'
      });
    });
  };

  this.changelog = function (req, resp, params) {
    var self = this;
    fetch('changelog.md', function (data) {
      var processed = _processContent(data);
      self.respond(processed, {
        format: 'html'
      , template: 'app/views/main/changelog'
      });
    });
  };

  this.community = function (req, resp, params) {
    var self = this;
    var gotStars = function (err, stars) {
      self.respond({stars: stars}, {
        format: 'html'
      , template: 'app/views/main/community'
      });
    };

    // get stargazers
    var opts = {
      url: 'https://api.github.com/repos/geddy/geddy/stargazers?page='+(Math.floor(Math.random()*10)+1)
    , dataType: 'json'
      , headers: {'User-Agent': 'GeddyJS documentation site'}
    };
    geddy.request(opts, gotStars);
  };

  this.faq = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/faq'
    });
  };


};

exports.Main = Main;


