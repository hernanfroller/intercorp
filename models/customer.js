'use strict';
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    name: DataTypes.STRING,
    lastName: DataTypes.STRING,
    age: DataTypes.INTEGER,
    birthDate: DataTypes.DATE
  }, {});
  Customer.associate = function(models) {
    // associations can be defined here
  };
  return Customer;
};