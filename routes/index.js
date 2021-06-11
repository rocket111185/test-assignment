'use strict';

const fs = require('fs');

module.exports = (app, addon) => {
  //fires after addon installation
  app.all('/installed', async (req, res, next) => {
    console.log('installation...');
    global.database
      .collection(global.JiraAccountInfoStore)
      .findOne({ 'installed.clientKey': req.body.clientKey }, (err, result) => {
        if (err) console.log(err);
        if (!result) {
          global.database
            .collection(global.JiraAccountInfoStore)
            .insertOne(req.body, async (err, res) => {
              if (err) throw err;
              next();
            });
        } else {
          global.database
            .collection(global.JiraAccountInfoStore)
            .updateOne(
              { 'installed.clientKey': req.body.clientKey },
              { $set: req.body },
              (err, res) => {
                next();
              }
            );
        }
      });
  });

  app.get('/', (req, res) => {
    res.format({
      'text/html'() {
        res.redirect('/atlassian-connect.json');
      },
      'application/json'() {
        res.redirect('/atlassian-connect.json');
      },
    });
  });

  app.get('/main-page', addon.authenticate(), async (req, res) => {
    res.render('main-page');
  });

  app.post('/main-page', addon.checkValidToken(), async (req, res) => {});

  // load any additional files you have in routes and apply those to the app
  {
    const path = require('path');
    const files = fs.readdirSync('routes');
    for (const index in files) {
      const file = files[index];
      if (file === 'index.js') continue;
      // skip non-javascript files
      if (path.extname(file) !== '.js') continue;

      const routes = require('./' + path.basename(file));

      if (typeof routes === 'function') {
        routes(app, addon);
      }
    }
  }
};
