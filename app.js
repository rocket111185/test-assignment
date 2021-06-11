'use strict';

// This is the entry point for your add-on, creating and configuring
// your add-on HTTP server

// [Express](http://expressjs.com/) is your friend -- it's the underlying
// web framework that `atlassian-connect-express` uses
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

app.use(bodyParser.json(/*{limit: '50mb', extended: true}*/));
app.use(bodyParser.urlencoded({ /*limit: '50mb',*/ extended: true }));

app.use(cookieParser());
const MemoryStore = session.MemoryStore;
app.set('trust proxy', 1);

app.use(
  session({
    key: 'express.lib',
    secret: 'ilovesaasjet',
    resave: false,
    cookie: {
      httpOnly: false,
      maxAge: 600000,
      sameSite: 'none',
      secure: true,
    },
    saveUninitialized: true,
    store: new MemoryStore(),
  })
);

//-----------------MONGO INTEGRATION--------------
const MongoClient = require('mongodb').MongoClient;

(async () => {
  global.connection = await MongoClient.connect(
    'mongodb://127.0.0.1:27017/admin',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  );
  global.database = await global.connection.db(global.databaseName);

  // var MemoryStore = require('session-memory-store')(session);
  const compression = require('compression');
  const errorHandler = require('errorhandler');
  const morgan = require('morgan');
  // You need to load `atlassian-connect-express` to use her godly powers
  const ac = require('atlassian-connect-express');
  // Static expiry middleware to help serve static resources efficiently
  process.env.PWD = process.env.PWD || process.cwd(); // Fix expiry on Windows
  const expiry = require('static-expiry');
  // We use [Handlebars](http://handlebarsjs.com/) as our view engine
  // via [express-hbs](https://npmjs.org/package/express-hbs)
  const hbs = require('express-hbs');
  // We also need a few stock Node modules
  const http = require('http');
  const path = require('path');
  const os = require('os');

  // Anything in ./public is served up as static content
  const staticDir = path.join(__dirname, 'public');
  // Anything in ./views are HBS templates
  const viewsDir = __dirname + '/views';
  // Your routes live here; this is the C in MVC
  // Bootstrap Express
  global.allowUpload = true;
  const routes = require('./routes');
  // Bootstrap the `atlassian-connect-express` library
  const addon = ac(app);
  // You can set this in `config.json`
  const port = addon.config.port();
  // Declares the environment to use in `config.json`
  const devEnv = app.get('env') === 'development';

  // The following settings applies to all environments
  app.set('port', port);

  // Configure the Handlebars view engine
  app.set('view engine', 'hbs');
  app.set('views', viewsDir);

  // Declare any Express [middleware](http://expressjs.com/api.html#middleware)
  // you'd like to use here
  // Log requests, using an appropriate formatter by env
  app.use(morgan(devEnv ? 'dev' : 'combined'));
  // Include request parsers

  // Gzip responses when appropriate
  app.use(compression());

  // You need to instantiate the `atlassian-connect-express` middleware
  // in order to get its goodness for free
  app.use(addon.middleware());
  // Enable static resource fingerprinting for far future expires caching
  // in production
  app.use(expiry(app, { dir: staticDir, debug: devEnv }));

  // Mount the static resource dir
  app.use(express.static(staticDir));
  app.use(express.static(path.join(__dirname, 'node_modules')));
  // Show nicer errors when in dev mode
  if (devEnv) app.use(errorHandler());

  // Wire up your routes using the express and `atlassian-connect-express`
  // objects
  routes(app, addon);

  //  process.on('exit', onExit);
  //  process.on('SIGINT', onExit);
  //  // process.on('beforeExit', onExit);
  //  process.on('uncaughtException', onExit);
  //
  //  const onExit = (options, exitCode) => {
  //      if(global.connection) global.connection.close();
  //      process.exit();
  //  }

  // Boot the damn thing
  http.createServer(app).listen(port, () => {
    console.log(
      'Add-on server running at http://' + os.hostname() + ':' + port
    );
    // Enables auto registration/de-registration of add-ons into a host
    // in dev mode
    if (devEnv) addon.register();
  });
})();

// Set the DB data
global.databaseName = 'testassignment';
global.JiraAccountInfoStore = 'jira';

