'use strict'

const models = require('../models');
const moment = require('moment');
const services = require('.');

module.exports.createCustomer = async (customer) => {

    try{
        const createdCustomer =  await models.Customer.create({
            name: customer.name || null,
            lastName: customer.lastName || null,
            age: customer.age || null,
            birthDate: customer.birthDate || null
          });

        if(!createdCustomer){
            return { error: 'ERROR.UNABLE_TO_CREATE_CUSTOMMER', msg: config.constants.ERROR_CUSTOMER_MSG  };
        }
        
        return createdCustomer
    
    } catch(err){
        throw err;
    }
}

module.exports.listAgeCustomers = async () => {
    try {
        return models.Customer.findAll({attributes: ['age']});
    } catch(err) {
        throw err;
    }
}

module.exports.listCustomers = async () => {
    try {
        return models.Customer.findAll({attributes: ['id', 'name', 'lastName','age', 'birthDate']});
    } catch(err) {
        throw err;
    }
}