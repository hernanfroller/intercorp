'use strict'

const app = require('../app');
const services = require('../services');
const config = require('./config');

app.listen(config.environment.PORT, () => {
    services.log.appLog({type:'info', fn: 'index.js', msg:`API REST corriendo en http://localhost:${config.environment.PORT}`});
    console.log(`API REST corriendo en http://localhost:${config.environment.PORT}`);
});