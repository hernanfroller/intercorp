'use strict'

const mysql = require('mysql');
const env = require('./../bin/environment');

const poolCluster = mysql.createPoolCluster();
poolCluster.add("MASTER", env.DB);
poolCluster.add("SLAVE", env.SLAVE);

module.exports ={
    master: poolCluster.of('MASTER'),
    reader: poolCluster.of('SLAVE*','ORDER'),
    writter: poolCluster.of('MASTER'),
};