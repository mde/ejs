We use the following example as a reference. There will be some differences with other environments.

#### Windows Azure

##### Pre-requisites
1. Install the azure-cli module.
```
npm install -g azure-cli
```
2. Download your Azure .publishsettings file. You will be asked to login with
your Azure credentials. If you do not have an account you can create one for
free.  ``` azure account download ``` 3. Import your .publishsettings file ```
azure account import [file] ``` 4. Install Geddy. If you're new, you can start
with the [tutorial](http://geddyjs.org/tutorial)

##### Notes
* Your Geddy app is deployed via Git, which will ignore anyhting specified in
the .gitignore including the config/secrets.json file.

If you need something that requires the secret such as sessions, etc. you'll
encounter errors about doing `geddy secret` when you deploy. In this case you'll
need to remove secrets.json from your .gitignore file. In this case, values in
the JSON file can be popluated from environment variables using EJS syntax, to
avoid including that sensitive information in revision control. See:
https://github.com/mde/geddy/issues/309

Now we need to create a `server.js` file which Windows Azure will pick up for
running Geddy server:

```javascript
var geddy = require('geddy');

geddy.start({
  port: process.env.PORT || '3000',
  // you can manually set the environment, or configure to use
  // the node_env setting which is configurable via iisnode.yml
  // after the site is created.
  environment: 'production'
  // To configure based on NODE_ENV use the following:
  //environment: process.env.NODE_ENV || 'development'
});
```

In the object we're giving to `geddy.start` you can use any other arguments
you'd for the configuration files, these will override the ones loaded for the
environment. For more information about this file you can go
[here](https://github.com/mde/geddy/wiki/Using-Geddy-without-the-CLI)

Open you .gitignore file and remove the line for `config\secrets.json` -
**note:** This is insecure, on public repo's as it exposes your cookie's secret
hash.

Now it's time to create a node site. Subsitute 'mysite' below with your site name.

```
azure site create mysite --git
```

After selecting a location add everything to git and push to Windows Azure

```
git push azure master
```

For more information about deploying and supporting Node Apps on Windows Azure
Websites see the [Command Line Tools
How-To-Guide](http://www.windowsazure.com/en-us/develop/nodejs/how-to-guides/command-line-tools/#WebSites)
article.

To learn more about Node Websites in Windows Azure see this <a
href="http://www.windowsazure.com/en-us/develop/nodejs/tutorials/create-a-website-(mac)/">article</a>

#### Nodejitsu

##### Pre-requisites
1. Install the [jitsu](https://npmjs.org/package/jitsu) module
2. Install Geddy. If you're new, you can start with the [tutorial](http://geddyjs.org/tutorial)
3. Create a Nodejitsu account(Not required: we'll go over creating one from the CLI)
4. Have an app ready to be deployed

##### Notes
* Nodejitsu reads the deployed .gitignore file, so if you have the config/secrets.json file in there(you should), then you'll encounter errors about needing to do `geddy secret` if you need the secrets for sessions, etc. To circumvent this, create a .npmignore file and include all the contents from the .gitignore _except_ the config/secrets.json line. Nodejitsu ignores the .gitignore file only if a .npmignore file is included as well.

If you haven't already you'll need to sign up and log in to Nodejitsu which you can do from the jitsu executable.
```
jitsu signup
jitsu login
```

Now once you've created an account on Nodejitsu we need to prepare the application you have for deployment. First we'll edit(or create) a `package.json` file in the app's root directory
```
{
  "name": "node-example",
  "version": "0.0.1",
  "dependencies": {
    "geddy": "0.6.x"
  },
  "subdomain": "geddy-example",
  "scripts": {
    "start": "app.js"
  },
  "engines": {
    "node": "0.8.x"
  }
}
```
Here we have a subdomain key/value this tells Nodejitsu what subdomain to host the application on(e,g,. geddy-example.jit.su). We also have a start script pointing to `app.js` in the root directory, we'll go over what to put here in a second. Of course you should edit this to include anything else you want, like other dependences or an author.

Now we need to create a `app.js` file so that Nodejitsu can use it to boot the Geddy server, here's what it should look like
```
var geddy = require('geddy');

geddy.start({
  environment: 'production'
});
```
In the object we're giving to `geddy.start` you can use any other arguments you'd for the configuration files, these will override the ones loaded for the environment. For more information about this file you can go [here](https://github.com/mde/geddy/wiki/Using-Geddy-without-the-CLI)

Now that our application is set up for deployment, we need to deploy it which is just a single command
```
jitsu deploy
```
Now you can go to http://geddy-example.jit.su and see your application!

#### Heroku

##### Pre-requisites
1. Install [heroku toolbelt](https://devcenter.heroku.com/articles/quickstart#step-2-install-the-heroku-toolbelt)
2. Install Geddy. If you're new, you can start with the [tutorial](http://geddyjs.org/tutorial)
3. Be familiar with GIT, the basic geddy commands, and heroku's deployment models
4. Have an app ready to be deployed.

Add a `package.json` file to your app's root directory

```
{
  "name": "node-example",
  "version": "0.0.1",
  "dependencies": {
    "geddy": "0.11.x"
  },
  "engines": {
    "node": "0.10.x",
    "npm": "1.3.x"
  }
}
```

Add a `.env` text file to your app's root directory. This is read by Foreman run booting the app locally.

```
NODE_ENV=development
```

Add a `Procfile` text file to your app's root directory. This is read by Heroku when booting the app.

```
web: geddy --environment $NODE_ENV
```

Now it's time to create a heroku app.

```
$ heroku create --stack cedar
```

Add the `NODE_ENV` environment variable to Heroku.

```
heroku config:set NODE_ENV=production
```

Add everything to git and push to Heroku.

```
$ git push heroku master
```

##### Database Add-Ons

Heroku gives you a database connection url, which you will need to parse.

First, add the database of your choice:

```
heroku addons:add mongohq:sandbox
```

This will give you a new environment variable that looks like this:

```
MONGOHQ_URL: mongodb://<user>:<pass>@hatch.mongohq.com:10034/app003132345
```

You have to use something like [parse_url](https://gist.github.com/ben-ng/6041159) to parse the URL into individual options.

Edit your `config/production.js` to parse the URL:

```
// See `parse_url` above
var MONGO_PARSED = parse_url(process.env.MONGOHQ_URL);

var config = {
  detailedErrors: false
, debug: false
, hostname: "0.0.0.0"
, port: process.env.PORT || 4000
, model: {
    defaultAdapter: 'mongo'
  }
, db: {
    mongo: {
      username: MONGO_PARSED.user
    , dbname: MONGO_PARSED.path.substring(1)	// Get rid of the leading `/`
    , password: MONGO_PARSED.pass
    , host: MONGO_PARSED.host
    , port: parseInt(MONGO_PARSED.port)
    }
  }
, sessions: {
    store: 'cookie'
  , key: 'did'
  , expiry: 14 * 24 * 60 * 60
  }
};

module.exports = config;
```
Your app should now be configured for the database add-on.

##### Secrets

If your app uses sessions or auth, you'll need to push your `secrets.json` file to Heroku. To do this securely, you'll have to use environment variables.

First, open up `secrets.json` and add each secret into your `.env` file.

For example, if your `config/secrets.json` file looks like this:

```
{
  "passport": {
    "loginPath": "/login",
    "successRedirect": "/",
    "failureRedirect": "/login?failed=true",
    "twitter": {
      "consumerKey": "secret1",
      "consumerSecret": "secret2"
    },
    "facebook": {
      "clientID": "secret3",
      "clientSecret": "secret4"
    }
  },
  "secret":"secret5"
}
```

Your `.env` file should look something like this:

```
NODE_ENV=development
TWITTER_KEY=secret1
TWITTER_SECRET=secret2
FACEBOOK_ID=secret3
FACEBOOK_SECRET=secret4
GEDDY_SECRET=secret5
```

You'll have to run a command like the following to save the environment variables to Heroku:

```
heroku config:set TWITTER_KEY=secret1 TWITTER_SECRET=secret2 FACEBOOK_ID=secret3 FACEBOOK_SECRET=secret4 GEDDY_SECRET=secret5
```

Finally, replace the secrets in your `secrets.json` with `EJS`:

```
{
  "passport": {
    "loginPath": "/login",
    "successRedirect": "/",
    "failureRedirect": "/login?failed=true",
    "twitter": {
      "consumerKey": "<%= process.env.TWITTER_KEY %>",
      "consumerSecret": "<%= process.env.TWITTER_SECRET %>"
    },
    "facebook": {
      "clientID": "<%= process.env.FACEBOOK_ID %>",
      "clientSecret": "<%= process.env.FACEBOOK_SECRET %>"
    }
  },
  "secret":"<%= process.env.GEDDY_SECRET %>"
}
```

Now remove `secrets.json` from your `.gitignore` file and push it to Heroku.

For more information about deploying and supporting Node Apps on Heroku see the [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs) article.
