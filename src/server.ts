import 'reflect-metadata';
import 'zone.js/dist/zone-node';
import { renderModuleFactory } from '@angular/platform-server'
import { enableProdMode } from '@angular/core'
import * as express from 'express';
import * as compression from 'compression';
import { join } from 'path';
import { readFileSync } from 'fs';
const domino = require('domino');// provee de dom al server
require('dotenv').load();
const bodyParser = require('body-parser');



const ctrlEmail  = require('./app/backend/controllers/email');




enableProdMode();
console.log("process.env.PORT: " + process.env.PORT)
const PORT = process.env.PORT || 4200;
const DIST_FOLDER = join(process.cwd(), 'dist');

const app = express();

app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const template = readFileSync(join(DIST_FOLDER, 'browser', 'index.html')).toString();

const win = domino.createWindow(template);
global['window'] = win;
global['document'] = win.document;


const { AppServerModuleNgFactory } = require('main.server');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.engine('html', (_, options, callback) => {
  const opts = { document: template, url: options.req.url };

  renderModuleFactory(AppServerModuleNgFactory, opts)
    .then(html => callback(null, html));
});

app.set('view engine', 'html');
app.set('views', 'src')

app.get('*.*', express.static(join(DIST_FOLDER, 'browser')));

app.get('*', (req, res) => {
  res.render('index', { req });
});

/*app.post('/email', (request, response) => {
    ctrlEmail.sendEmail;
});

app.post('/emailServ/:servicioid', (request, response) => {
    ctrlEmail.sendEmailPrice;
});*/




app.post('/email',ctrlEmail.sendEmail);
app.post('/emailServ/:servicioid',ctrlEmail.sendEmailPrice);


app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}!`);
});
