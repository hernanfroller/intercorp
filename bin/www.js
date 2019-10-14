'use strict'

const app = require('../app');
const config = require('./config');

app.listen(config.environment.PORT, () => {
    console.log(`API REST corriendo en http://localhost:${config.environment.PORT}`);
});