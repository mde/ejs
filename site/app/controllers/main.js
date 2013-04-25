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

var md = require('marked');
var hljs = require('highlight.js');
md.setOptions({
  gfm: true
, pedantic: false
, highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  }
});

var Main = function () {

  this.error = function (req, resp, params) {
    console.log(params.error);
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/error'
    });
  };

  this.index = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/index'
    });
  };

  this.documentation = function (req, resp, params) {
    var self = this
    , docs = []
    , count = 0

    // once we've got a list of commits, get the tree
    // for the latest commit
    , gotCommits = function (err, commits) {
      if (err) {
        params.error = err;
        return self.error(req, resp, params);
      }
      var commit = commits[0] && commits[0].commit
        , url = commit.tree && commit.tree.url;
      return getTree(url, gotTree);
    }

    // once we've got the first tree, get 'docs' tree
    // once we've got the 'docs' tree, call gotTree
    , getTree = function (url, callback) {
        var tree;
        opts.url = url;
        opts.headers = {'User-Agent': 'GeddyJS documentation site'}

        geddy.request(opts, function (err, trees) {
          if (err || !trees) {
            params.error = err;
            return self.error(req, resp, params);
          }
          for (var i in trees.tree) {
            tree = trees.tree[i];
            if (tree.path == 'docs') {
              return getTree(tree.url, gotTree);
            }
          }
          return callback(err, trees.tree);
        });
    }
    , getBlob = function (paths, i, callback) {
      var options = {
        url: paths[i].url
      , dataType: 'json'
      , headers: {'User-Agent': 'GeddyJS documentation site'}
      }
      geddy.request(options, function (err, resp) {

        if (err) {
          params.error = err;
          return self.error(req, resp, params)
        }

        var content = (resp.content) ? new Buffer(resp.content, 'base64').toString('utf8') : ''
          , name = paths[i].path.replace('.md','').split('-')
          , subs = []
          , lines = content.split('\n');
        for (var l in lines) {
          if (lines[l].indexOf('#### ') == 0) {
            subs.push(geddy.string.trim(lines[l].replace('#### ', '')));
          }
        }
        docs[parseInt(name[0]) - 1] = {
          name: name[1]
        , content: md(content)
        , subs: subs
        };
        return respond(paths.length);
      });
    }

    // once we've got the 'docs' tree,
    // parse it and call getBlob for each file
    , gotTree = function (err, tree) {
      if (err) {
        params.error = err;
        return self.error(req, resp, params);
      }

      for (var i in tree) {
        getBlob(tree, i, respond);
      }
    }

    // once we've got everything done, respond with data
    , respond = function (total) {
      count++;
      if (count == total) {
        self.respond({docs: docs}, {
          format: 'html'
        , template: 'app/views/main/documentation'
        });
      }
    }

    // inital call to get the commits
    , opts = {
        url: 'https://api.github.com/repos/mde/geddy/commits'
      , dataType: 'json'
      , headers: {'User-Agent': 'GeddyJS documentation site'}
    }
    geddy.request(opts, gotCommits);
  };

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
      url: 'https://raw.github.com/mde/geddy/master/tutorial.md'
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
      url: 'https://raw.github.com/mde/geddy/master/changelog.md'
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


