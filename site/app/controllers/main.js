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
  , hljs = require('highlight.js');

var BRANCH = 'master'
  , URL_PREFIX = 'https://raw.github.com/mde/geddy/' +
        BRANCH + '/docs/'
  , USE_LOCAL = true;

md.setOptions({
  gfm: true
, pedantic: false
, highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  }
});

var Main = function () {

  // Utility methods
  var fetch = function (p, cb) {
        var opts
          , filePath;
        if (USE_LOCAL) {
          filePath = path.join('../docs', p);
          fs.readFile(filePath, function (err, data) {
            if (err) { throw err; }
            cb(data.toString());
          });
        }
        else {
          opts = {
            url: URL_PREFIX + p
          , headers: {'User-Agent': 'GeddyJS documentation site'}
          };
          geddy.request(opts, function (err, data) {
            if (err) { throw err; }
            cb(data);
          });
        }
      }

    , getTopicsForDocType = function (docType, callback) {
        fetch(docType + '/topics.json', function (data) {
          callback(JSON.parse(data));
        });
      }

    , getDocForTopic = function (docType, topic, callback) {
        fetch(docType + '/' + topic.path + '.md', function (data) {
          var content = data
            , name = topic.name
            , subHeads = []
            , lines = content.split('\n');
          for (var l in lines) {
            if (lines[l].indexOf('#### ') == 0) {
              subHeads.push(geddy.string.trim(lines[l].replace('#### ', '')));
            }
          }
          content = md(content);
          callback({
            name: name
          , content: content
          , subs: subHeads
          });
        });
      };

  //this.cacheResponse(['reference', 'guide']);

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
          , docs = [];
        // Pull down and format the content for each topic
        topics.forEach(function (t) {
          getDocForTopic(docType, t, function (content) {
            docs.push(content);
            count--;
            // Render when they're all assembled
            if (count == 0) {
              self.respond({docs: docs}, {
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

    // respond to the request
    var respond = function (sections, content) {
      self.respond({sections: sections, content: content}, {
        format: 'html'
      , template: 'app/views/main/tutorial'
      });
    }

    // find the sections
    var gotTutorial = function (err, tutorial) {
      if (err) {
        throw err;
      }
      var content = md(tutorial);
      var lines = tutorial.split('\n');
      var sections = [];
      for (var i in lines) {
        if (lines[i].indexOf('### ') == 0) {
          sections.push(geddy.string.trim(lines[i].replace("###", '')));
        }
      }
      respond(sections, content);
    }

    // get the tutorial markdown file
    geddy.request({
      url: 'https://raw.github.com/mde/geddy/' + BRANCH + '/tutorial.md'
      , headers: {'User-Agent': 'GeddyJS documentation site'}
      }, gotTutorial);
  };

  this.changelog = function (req, resp, params) {
    var self = this;

    // respond to the request
    var respond = function (sections, content) {
      self.respond({sections: sections, content: content}, {
        format: 'html'
      , template: 'app/views/main/changelog'
      });
    }

    // find the sections
    var gotTutorial = function (err, tutorial) {
      var content = md(tutorial);
      var lines = tutorial.split('\n');
      var sections = [];
      for (var i in lines) {
        if (lines[i].indexOf('### ') == 0) {
          sections.push(geddy.string.trim(lines[i].replace("###", '')));
        }
      }
      respond(sections, content);
    }

    // get the tutorial markdown file
    geddy.request({
      url: 'https://raw.github.com/mde/geddy/' + BRANCH + '/changelog.md'
      , headers: {'User-Agent': 'GeddyJS documentation site'}

      }, gotTutorial);
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
      url: 'https://api.github.com/repos/mde/geddy/stargazers?page='+(Math.floor(Math.random()*10)+1)
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


