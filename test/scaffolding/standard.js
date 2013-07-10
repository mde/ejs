(function () {
  var utils = require('utilities')
    , assert = require('assert')
    , request = require('request')
    , path = require('path')
    , fs = require('fs')
    , cmd = require('../../lib/cmd').Cmd
    , geddyCli = path.join(__dirname,'../','../','bin','cli')+'.js'
    , tmpDir = path.join(__dirname, '../', 'tmp')
    , staticId = utils.string.uuid(10)
    , engines = {
        ejs: null
      , jade: '-j'
      , swig: '-s'
      , handlebars: '-H'
      , mustache: '-m'
      }
    /*
    * Runs `geddy gen app` with the specified template engine
    */
    , scaffoldApp = function (engine, flag, cb) {
        var spawn = require('child_process').spawn
          , testDir = tmpDir
          , cmd = geddyCli
          , opts = ['gen', 'app', engine + 'App']
          , srcModules = path.join(__dirname, '..', '..', 'node_modules')
          , appDir = path.join(testDir, engine + 'App')
          , proc;

        if(flag) {
          opts.push(flag);
        }

        proc = spawn(cmd, opts, {cwd:testDir});

        proc.stderr.setEncoding('utf8');

        proc.stderr.on('data', function (data) {
          console.error(data);
          if (/^execvp\(\)/.test(data)) {
            assert.ok(false, 'Failed to generate scaffolding for ' + engine);
          }
        });

        proc.on('close', function (code) {
          // Create a copy of node_modules so the generated apps don't need to
          // do an `npm install`
          utils.file.cpR(srcModules, appDir, {silent: true});
          cb();
        });
      }
    /*
    * Runs `geddy gen scaffold zoobies foo:string bar:number`
    * with the specified template engine
    */
    , scaffoldResource = function (engine, flag, cb) {
        var spawn = require('child_process').spawn
          , testAppDir = path.join(tmpDir, engine + 'App')
          , cmd = geddyCli
          , opts = ['gen', 'scaffold']
          , proc;

        if(flag) {
          opts.push(flag);
        }

        opts = opts.concat(['zoobies', 'foo:string', 'bar:number']);

        proc = spawn(cmd, opts, {cwd:testAppDir});

        proc.stderr.setEncoding('utf8');

        proc.stderr.on('data', function (data) {
          console.error(data);
          if (/^execvp\(\)/.test(data)) {
            assert.ok(false, 'Failed to generate scaffolding for ' + engine);
          }
        });

        proc.on('close', function (code) {
          cb();
        });
      }
    /*
    * Starts a geddy server
    */
    , startServer = function (engine, port, cb) {
        var spawn = require('child_process').spawn
          , testAppDir = path.join(tmpDir, engine + 'App')
          , cmd = geddyCli
          , opts = ['--port', port]
          , server
          , notified = false
          , failed = false;

        server = spawn(cmd, opts, {cwd:testAppDir});

        server.stderr.setEncoding('utf8');

        server.stderr.on('data', function (data) {
          console.log(data);
        });

        console.log("Starting " + engine + " app on port " + port);

        server.stdout.on('data', function (data) {
          var ready = data.toString().match(/Server worker running in [a-z]+? on port [0-9]+? with a PID of: [0-9]+?/)?true:false;

          if(!notified && ready) {
            notified = true;
            cb(server);
          }
        });
      }
  /*
  * Kills a geddy server
  */
  , killServer = function (server, cb) {
      server.on('close', function (code) {
        cb();
      });

      server.kill("SIGHUP");
    }
  , tests = {}
  , servers = []
  , port = 8090
  , portCopy = port
  , base = 'http://127.0.0.1:'
  , baseUrl
  , reqOpts = {
      timeout: 1000
    };

  /*
  * CRUD Tests
  */
  for(var engine in engines) {
    (function (baseUrl) {

      tests["test " + engine + " shows site index"] = function(next) {
        //Request index
        request(baseUrl, reqOpts, function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when requesting ' + baseUrl);
          assert.notStrictEqual(body.match(/Hello, World!/), null, 'Hello world text is missing')
          next();
        });
      };

      tests["test " + engine + " site index with malformed query string"] = function(next) {
        //Request index
        request(baseUrl + '?test=t%\'2B', reqOpts, function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 400, 'Error '+res.statusCode+' when requesting ' + baseUrl);
          next();
        });
      };

      tests["test " + engine + " index when empty"] = function(next) {
        //Request index
        request(baseUrl + '/zoobies', reqOpts, function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when requesting /zoobies: ' + body);
          assert.notStrictEqual(body.match(/<div id="zoobies-list">\s*<\/div>/gi), null, 'There should be an empty zoobies list')
          next();
        });
      };

      tests["test " + engine + " create entry"] = function(next) {
        //Request index
        request({
          method: 'POST'
        , uri: baseUrl + '/zoobies'
        , form: {
            foo: 'zerb'
          , bar: '2112'
          , id: staticId  // Just use a static ID to keep tests cleaner
          }
        , timeout: 1000
        , followAllRedirects: true
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when creating zoobies');
          assert.notStrictEqual(body.match(/id="zooby-[a-z0-9\-]+"/gi), null, 'There should be a zooby in the list')
          assert.strictEqual(body.match(/id="zooby-[a-z0-9\-]+"/gi).length, 1, 'There should be exactly one zooby in the list')
          assert.strictEqual(body.indexOf('id="zooby-' + staticId + '"')>=0, true, 'The zooby should have the expected ID')
          next();
        });
      };

      tests["test " + engine + " show initial values"] = function(next) {
        //Request index
        request({
          method: 'GET'
        , uri: baseUrl + '/zoobies/' + staticId
        , timeout: 1000
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when showing zoobies');
          assert.strictEqual(body.indexOf('<span class="foo">zerb</span>') >= 0 , true , 'Foo was persisted correctly')
          assert.strictEqual(body.indexOf('<span class="bar">2112</span>') >= 0 , true , 'Bar was persisted correctly')
          next();
        });
      };

      tests["test " + engine + " show initial values in JSON"] = function(next) {
        //Request index
        request({
          method: 'GET'
        , uri: baseUrl + '/zoobies/' + staticId + '.json'
        , timeout: 1000
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when showing zoobies');

          body = JSON.parse(body);

          assert.deepEqual(body, {
            "params": {
              "method": "GET"
            , "controller": "Zoobies"
            , "action": "show"
            , "format": "json"
            , "id": body.params.id
            }
          , "zooby": {
              "createdAt": body.zooby.createdAt
            , "foo": "zerb"
            , "bar": 2112
            }
          });
          next();
        });
      };

      tests["test " + engine + " update form persists values"] = function(next) {
        //Request index
        request({
          method: 'GET'
        , uri: baseUrl + '/zoobies/' + staticId + '/edit'
        , timeout: 1000
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when updating zooby');

          // FIXME: Is there a less stupid way of asserting this?

          assert.strictEqual(
            body.indexOf('input type="text" class="span6" name="foo" value="zerb"') >= 0  // ms
          ||body.indexOf('input class="span6" name="foo" type="text" value="zerb"') >= 0  // ejs
          , true , 'Foo was persisted correctly')

          assert.strictEqual(
            body.indexOf('input type="number" class="span2" name="bar" value="2112"') >= 0 // ms
          ||body.indexOf('input class="span2" name="bar" type="number" value="2112"') >= 0  // ejs
          , true , 'Bar was persisted correctly')

          next();
        });
      };

      tests["test " + engine + " update values"] = function(next) {
        //Request index
        request({
          method: 'PUT'
        , uri: baseUrl + '/zoobies/' + staticId
        , form: {
            foo: 'overture'
          , bar: '1984'
          }
        , timeout: 1000
        , followAllRedirects: true
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when updating zooby');
          assert.notStrictEqual(body.match(/id="zooby-[a-z0-9\-]+"/gi), null, 'There should be a zooby in the list')
          assert.strictEqual(body.match(/id="zooby-[a-z0-9\-]+"/gi).length, 1, 'There should be exactly one zooby in the list')
          assert.strictEqual(body.indexOf('id="zooby-' + staticId + '"')>=0, true, 'The zooby should have the expected ID')
          next();
        });
      };

      tests["test " + engine + " show updated values"] = function(next) {
        //Request index
        request({
          method: 'GET'
        , uri: baseUrl + '/zoobies/' + staticId
        , timeout: 1000
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when showing zoobies');
          assert.strictEqual(body.indexOf('<span class="foo">overture</span>') >= 0 , true , 'Foo was updated correctly')
          assert.strictEqual(body.indexOf('<span class="bar">1984</span>') >= 0 , true , 'Bar was updated correctly')
          next();
        });
      };

      tests["test " + engine + " delete entry"] = function(next) {
        //Request index
        request({
          method: 'DELETE'
        , uri: baseUrl + '/zoobies/' + staticId
        , timeout: 1000
        , followAllRedirects: true
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 200, 'Error '+res.statusCode+' when deleting zooby');
          assert.strictEqual(body.match(/id="zooby-[a-z0-9\-]+"/gi), null, 'There should be no zoobies in the list')
          next();
        });
      };

      tests["test " + engine + " 404"] = function(next) {
        //Request index
        request({
          method: 'GET'
        , uri: baseUrl + '/zoobies/' + staticId
        , timeout: 1000
        }
        , function(err, res, body) {
          assert.strictEqual(err, null, err);
          assert.strictEqual(res.statusCode, 404, 'Should get error 404 viewing nonexistant zooby');
          next();
        });
      };

    }(base + portCopy));

    // Increment Port Number
    portCopy++;
  }

  /*
  * The before action will generate the scaffolded apps
  */
  tests.before = function (next) {
    var generators = []
      , chain
      , portCopy = port;

    // Generate a new app for each engine
    for(var engine in engines) {
      (function (serverPort) {
        generators.push({
          func: scaffoldApp
        , args: [engine, engines[engine]]
        , callback: null
        });
        generators.push({
          func: scaffoldResource
        , args: [engine, engines[engine]]
        , callback: null
        });
        generators.push({
          func: startServer
        , args: [engine, serverPort]
        , callback: function (server) {
            servers.push(server);
          }
        });
      }(portCopy));

      // Increment port number
      portCopy++;
    }

    chain = new utils.async.AsyncChain(generators);

    chain.last = next;

    chain.run();
  };

  /*
  * The after action cleans the temporary directory
  */
  tests.after = function (next) {
    //Kill all the servers
    var killers = [];
    for(var key in servers) {
      killers.push({
        func: killServer
      , args: [servers[key]]
      , callback: null
      });
    }

    chain = new utils.async.AsyncChain(killers);

    chain.last = function () {
      //utils.file.rmRf(tmpDir, {silent:true});
      next();
    };

    chain.run();
  };

  module.exports = tests;
}());
