We use the following example as a reference. There will be some diferences with other environments. 

#### Heroku

##### Pre-requisites
1. Install [heroku toolbelt](https://devcenter.heroku.com/articles/quickstart#step-2-install-the-heroku-toolbelt)
2. Install geddy. If you're new, you can start with the [tutorial](http://geddyjs.org/tutorial)
3. Be familiar with GIT, the basic geddy commands, and heroku's deployment models
4. Have an app ready to be deployed. 

Add a `package.json` file to your app's root folder

```javascript
{
  "name": "node-example",
  "version": "0.0.1",
  "dependencies": {
    "geddy": "0.5.x"
  },
  "engines": {
    "node": "0.8.x",
    "npm": "1.1.x"
  }
}
```

Edit the `config/production.js` file to use the port given by heroku
```javascript
var config = {
  port: process.env.PORT
  // Other properties removed for brevity
};

```

Add a `Procfile` text file to your app's root folder

```
//web: node node_modules/geddy/bin/cli.js
var geddy = require('geddy');

if (geddy.isMaster) {
  geddy.config({ environment: 'production' }); 
}   

geddy.start();
```

Now it's time to create a heroku app. 

```
$ heroku create --stack cedar
```

Add everything to git and push to heroku 

```
$ git push heroku master
```

For more information about deploying and supporting Node Apps on Heroku see the [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/nodejs) article. 