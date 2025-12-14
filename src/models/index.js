const { sequelize } = require('../config/database');
const SensorData = require('./SensorData');
const DeviceLog = require('./DeviceLog');

const models = {
  SensorData,
  DeviceLog,
  sequelize
};

module.exports = models;