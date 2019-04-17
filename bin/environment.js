'use strict'

module.exports = {
    PORT: process.env.PORT || 3000,
    DB: {
        host: process.env.DBM_HOST || 'fitco-desa.ccqeacelomty.us-east-1.rds.amazonaws.com',
        port: process.env.DBM_PORT || 3316,
        user: process.env.DBM_USER || 'FZ3B6H5o',
        password: process.env.DBM_PWD || '*P7df17C0b4s3*',
        database: process.env.DBM_DB || 'fitcosys',
        multipleStatements: true
    },
    SLAVE:
    {
        host: process.env.DBS1_HOST || 'replica01-fitco-desa.ccqeacelomty.us-east-1.rds.amazonaws.com',
        port: process.env.DBS1_PORT || 3316,
        user: process.env.DBS1_USER || 'FZ3B6H5o',
        password: process.env.DBS1_PWD || '*P7df17C0b4s3*',
        database: process.env.DBS1_DB || 'fitcosys',
        multipleStatements: true
    },
    LOG: '/var/log/microservice.log',
    SEND_GRID:
    {
        key: 'UG4zagtyTIOtzs_KGw2cgQ',
        authorization: 'Bearer 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',
        url:  'https://api.sendgrid.com/v3/mail/send',
        active: true //Funcionalidades por validar
    }
}