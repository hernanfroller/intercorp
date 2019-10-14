'use strict'

const express = require('express');
const api = express.Router();
const controller = require('../controllers/customer.controller');

api.post('/creacliente', controller.add);
api.get('/listclientes', controller.list);
api.get('/kpideclientes', controller.kpi);

module.exports = api;