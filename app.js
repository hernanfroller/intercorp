'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const api = require('./routes');

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/docs/', express.static('docs',{ redirect : false }));
app.use(bodyParser.json());
app.use('', api);

module.exports = app;