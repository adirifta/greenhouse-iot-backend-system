const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SensorData = sequelize.define('SensorData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sensorId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  temperature: {
    type: DataTypes.FLOAT(5, 2),
    allowNull: false,
    validate: {
      min: -50,
      max: 100
    }
  },
  humidity: {
    type: DataTypes.FLOAT(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  soilMoisture: {
    type: DataTypes.FLOAT(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  lightIntensity: {
    type: DataTypes.FLOAT(8, 2),
    validate: {
      min: 0
    }
  },
  co2Level: {
    type: DataTypes.FLOAT(8, 2),
    validate: {
      min: 0
    }
  },
  timestamp: {
    type: DataTypes.DATE(6),
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sensor_data',
  timestamps: false,
//   charset: 'utf8mb4',
//   collate: 'utf8mb4_unicode_ci',
//   engine: 'InnoDB',
//   indexes: [
//     {
//       name: 'idx_sensor_id',
//       fields: ['sensorId']
//     },
//     {
//       name: 'idx_timestamp',
//       fields: ['timestamp']
//     },
//     {
//       name: 'idx_sensor_timestamp',
//       fields: ['sensorId', 'timestamp']
//     }
//   ]
});

module.exports = SensorData;