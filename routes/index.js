'use strict'

const express = require('express');
const api = express.Router();
const schedule = require('./schedule.route');

api.use('/schedule', schedule);

module.exports = api;