'use strict'

const services = require('../services');
const config = require('../bin/config');
const responseHelper = require('../helpers/response.helper');
const math = require('mathjs');
const moment = require('moment');

async function add(req, res, next) {
    try {
        const response = await services.customer.createCustomer(req.body);
        if( !response.error ){
            res.status(200);
            return res.json(responseHelper.successResponse(response));
          }else{
              res.status(400);
              return res.json(response)
          }
    } catch(err) {
        console.error(err);
        res.status(400)
        return res.json({ error: 'ERROR.GLOBAL', msg: config.constants.ERROR_MSG  });
    }
};

async function list(req, res, next) {
    try {
        const customers = await services.customer.listCustomers();
        customers.map(customer => customer.dataValues.deathDay = moment(customer.dataValues.birthDate).add(config.constants.PERU_AVERAGE_LIFE, 'years'));
        res.status(200);
        return res.json(responseHelper.successResponse(customers));
    } catch(err) {
        console.error(err);
        res.status(400)
        return res.json({ error: 'ERROR.GLOBAL', msg: config.constants.ERROR_MSG  });
    }
};

async function kpi(req, res, next) {
    try {
        const ageCustomers = await services.customer.listAgeCustomers();
        let ages = [];
        ageCustomers.map(customer  => ages.push(customer.dataValues.age));
        const mean = math.mean(ages).toFixed(4);
        const median = math.median(ages);
        const std = math.std(ages).toFixed(4);
        const response = { promedio: mean, media:median, desviacionEstandar: std };
        res.status(200);
        return res.json(responseHelper.successResponse(response));
    } catch(err) {
        console.error(err);
        res.status(400)
        return res.json({ error: 'ERROR.GLOBAL', msg: config.constants.ERROR_MSG  });
    }
};

module.exports = {
    add,
    list,
    kpi
}