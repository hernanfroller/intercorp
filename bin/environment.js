'use strict'

require('dotenv').config();

module.exports = {
    db: {
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        dialect: 'postgres'
    },
    PORT: process.env.PORT,
    LOG: '/var/log/microservice.log'
}