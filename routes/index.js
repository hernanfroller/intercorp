'use strict'

const express = require('express');
const api = express.Router();
const customer = require('./customer.route');

api.use('/', customer);

module.exports = api;