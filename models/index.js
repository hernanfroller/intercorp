
const fs = require("fs");
const path = require("path");
const config = require('../bin/config');
const Sequelize = require('sequelize');
require('dotenv').config();
const basename = path.basename(__filename);
let models = {};

const sequelize = new Sequelize(
  config.environment.db.database,
  config.environment.db.username,
  config.environment.db.password,
  {
    host: config.environment.db.host,
    port: config.environment.db.port,
    logging: console.log,
    dialect: config.environment.db.dialect,
    dialectOptions: {
      ssl: 'Amazon RDS'
    }
  },
);

fs.readdirSync(__dirname)
  .filter(file => {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach(file => {
    const model = sequelize["import"](path.join(__dirname, file));
    models[model.name] = model
  });

models["Op"] = Sequelize.Op;

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
module.exports.sequelize = { sequelize };
