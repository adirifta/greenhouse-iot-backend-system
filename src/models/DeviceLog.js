const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeviceLog = sequelize.define('DeviceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  command: {
    type: DataTypes.ENUM('ON', 'OFF'),
    allowNull: false
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED'),
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT('medium'),
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  timestamp: {
    type: DataTypes.DATE(6),
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'device_logs',
  timestamps: false,
//   charset: 'utf8mb4',
//   collate: 'utf8mb4_unicode_ci',
//   engine: 'InnoDB',
//   indexes: [
//     {
//       name: 'idx_device_id',
//       fields: ['deviceId']
//     },
//     {
//       name: 'idx_timestamp',
//       fields: ['timestamp']
//     },
//     {
//       name: 'idx_status',
//       fields: ['status']
//     },
//     {
//       name: 'idx_device_timestamp',
//       fields: ['deviceId', 'timestamp']
//     }
//   ]
});

module.exports = DeviceLog;