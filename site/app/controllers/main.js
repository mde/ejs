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

var Main = function () {

  this.error = function (req, resp, params) {
    self.respond(params, {
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
    , opts = {
      url: 'https://api.github.com/repos/mde/geddy/commits'
    , dataType: 'json'
    }
    , getTree = function (url, callback) {
        var tree;
        opts.url = url;
        geddy.request(opts, function (err, trees) {
          if (err || !trees) {
            return this.error(req, resp, params);
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
    , gotCommits = function (err, commits) {
      var commit = commits[0] && commits[0].commit
        , url = commit.tree && commit.tree.url;
      return getTree(url, gotTree);
    }
    , gotTree = function (err, tree) {
      for (var i in tree) {
        console.log(tree[i].path, ':', tree[i].url);
      }
      self.respond(params, {
        format: 'html'
      , template: 'app/views/main/documentation'
      });
    }
    geddy.request(opts, gotCommits);
  };

  this.tutorial = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/tutorial'
    });
  };

  this.blog = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/blog'
    });
  };

  this.article = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/blog_post'
    });
  };

  this.community = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/community'
    });
  };

  this.faq = function (req, resp, params) {
    this.respond(params, {
      format: 'html'
    , template: 'app/views/main/faq'
    });
  };


};

exports.Main = Main;


