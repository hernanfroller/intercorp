'use strict'

const express = require('express');
const api = express.Router();
const schedule = require('./schedule.route');

api.use('/', schedule);

module.exports = api;