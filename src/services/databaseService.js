const logger = require('../utils/logger');
const { sequelize } = require('../config/database');
const { SensorData, DeviceLog } = require('../models');

class DatabaseService {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  async initialize() {
    try {
      await sequelize.authenticate();
      logger.info('Database authentication successful');
      
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      logger.info('Database models synchronized');
      
      this.retryAttempts = 0;
      return true;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        logger.info(`Retrying database connection in ${this.retryDelay/1000} seconds... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      }
      
      throw new Error(`Failed to initialize database after ${this.maxRetries} attempts`);
    }
  }

  async storeSensorData(sensorData) {
    const transaction = await sequelize.transaction();
    
    try {
      this.validateSensorData(sensorData);
      
      const savedData = await SensorData.create(sensorData, { transaction });
      
      if (sensorData.temperature > 35 || sensorData.temperature < 5) {
        await this.createAlertLog({
          type: 'TEMPERATURE_ALERT',
          sensorId: sensorData.sensorId,
          value: sensorData.temperature,
          threshold: sensorData.temperature > 35 ? 35 : 5,
          message: `Temperature ${sensorData.temperature}°C outside safe range`
        }, transaction);
      }
      
      await transaction.commit();
      logger.debug(`Sensor data stored: ${sensorData.sensorId}`);
      
      return savedData;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to store sensor data:', error);
      throw error;
    }
  }

  async storeDeviceLog(deviceLog) {
    try {
      const log = await DeviceLog.create(deviceLog);
      logger.debug(`Device log stored: ${deviceLog.deviceId} - ${deviceLog.command}`);
      return log;
    } catch (error) {
      logger.error('Failed to store device log:', error);
      throw error;
    }
  }

  async getSensorData(filters = {}, pagination = {}) {
    try {
      const {
        sensorId,
        startDate,
        endDate,
        minTemperature,
        maxTemperature
      } = filters;
      
      const {
        page = 1,
        limit = 100,
        sortBy = 'timestamp',
        sortOrder = 'DESC'
      } = pagination;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      if (sensorId) where.sensorId = sensorId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.$gte = new Date(startDate);
        if (endDate) where.timestamp.$lte = new Date(endDate);
      }
      if (minTemperature !== undefined) where.temperature = { $gte: minTemperature };
      if (maxTemperature !== undefined) {
        where.temperature = where.temperature || {};
        where.temperature.$lte = maxTemperature;
      }
      
      const { count, rows } = await SensorData.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          hasNext: (page * limit) < count,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to fetch sensor data:', error);
      throw error;
    }
  }

  async getDeviceLogs(filters = {}, pagination = {}) {
    try {
      const {
        deviceId,
        status,
        command,
        startDate,
        endDate
      } = filters;
      
      const {
        page = 1,
        limit = 100,
        sortBy = 'timestamp',
        sortOrder = 'DESC'
      } = pagination;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      // Apply filters
      if (deviceId) where.deviceId = deviceId;
      if (status) where.status = status;
      if (command) where.command = command;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.$gte = new Date(startDate);
        if (endDate) where.timestamp.$lte = new Date(endDate);
      }
      
      const { count, rows } = await DeviceLog.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          hasNext: (page * limit) < count,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to fetch device logs:', error);
      throw error;
    }
  }

  async getSensorStatistics(sensorId, period = '24h') {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 1);
      }
      
      const where = {
        sensorId,
        timestamp: {
          $gte: startDate,
          $lte: now
        }
      };
      
      const data = await SensorData.findAll({
        where,
        attributes: [
          [sequelize.fn('AVG', sequelize.col('temperature')), 'avgTemperature'],
          [sequelize.fn('MAX', sequelize.col('temperature')), 'maxTemperature'],
          [sequelize.fn('MIN', sequelize.col('temperature')), 'minTemperature'],
          [sequelize.fn('AVG', sequelize.col('humidity')), 'avgHumidity'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'readingCount']
        ],
        raw: true
      });
      
      const deviceStats = await DeviceLog.findAll({
        where: { deviceId: sensorId },
        attributes: [
          'command',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['command'],
        raw: true
      });
      
      return {
        sensorStats: data[0] || {},
        deviceStats,
        period,
        from: startDate,
        to: now
      };
    } catch (error) {
      logger.error('Failed to get sensor statistics:', error);
      throw error;
    }
  }

  async createAlertLog(alertData, transaction = null) {
    try {
      const AlertLog = sequelize.models.AlertLog || (await this.createAlertLogModel());
      
      const log = await AlertLog.create({
        type: alertData.type,
        sensorId: alertData.sensorId,
        deviceId: alertData.deviceId,
        value: alertData.value,
        threshold: alertData.threshold,
        message: alertData.message,
        severity: alertData.severity || 'WARNING',
        acknowledged: false
      }, { transaction });
      
      logger.warn(`Alert logged: ${alertData.message}`);
      return log;
    } catch (error) {
      logger.error('Failed to create alert log:', error);
    }
  }

  async createAlertLogModel() {
    const { DataTypes } = require('sequelize');
    
    const AlertLog = sequelize.define('AlertLog', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      sensorId: DataTypes.STRING,
      deviceId: DataTypes.STRING,
      value: DataTypes.FLOAT,
      threshold: DataTypes.FLOAT,
      message: DataTypes.TEXT,
      severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
        defaultValue: 'WARNING'
      },
      acknowledged: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      acknowledgedAt: DataTypes.DATE,
      acknowledgedBy: DataTypes.STRING,
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'alert_logs',
      timestamps: false
    });
    
    await AlertLog.sync();
    return AlertLog;
  }

  validateSensorData(data) {
    const requiredFields = ['sensorId', 'temperature', 'humidity'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    if (typeof data.temperature !== 'number' || data.temperature < -50 || data.temperature > 100) {
      throw new Error(`Invalid temperature value: ${data.temperature}`);
    }
    
    if (typeof data.humidity !== 'number' || data.humidity < 0 || data.humidity > 100) {
      throw new Error(`Invalid humidity value: ${data.humidity}`);
    }
    
    if (data.soilMoisture !== undefined && (data.soilMoisture < 0 || data.soilMoisture > 100)) {
      throw new Error(`Invalid soil moisture value: ${data.soilMoisture}`);
    }
    
    return true;
  }

  async healthCheck() {
    try {
      await sequelize.authenticate();

      await SensorData.findOne({ limit: 1 });
      await DeviceLog.findOne({ limit: 1 });
      
      const [result] = await sequelize.query('SELECT sqlite_version() as version');
      const dbInfo = {
        dialect: sequelize.options.dialect,
        version: result[0].version,
        database: sequelize.options.storage
      };
      
      return {
        status: 'healthy',
        message: 'Database is operational',
        details: dbInfo
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  async cleanupOldData(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const sensorDeleted = await SensorData.destroy({
        where: {
          timestamp: {
            $lt: cutoffDate
          }
        }
      });
      
      const logDeleted = await DeviceLog.destroy({
        where: {
          timestamp: {
            $lt: cutoffDate
          }
        }
      });
      
      logger.info(`Data cleanup completed: ${sensorDeleted} sensor records and ${logDeleted} log records deleted`);
      
      return {
        sensorRecordsDeleted: sensorDeleted,
        logRecordsDeleted: logDeleted,
        cutoffDate
      };
    } catch (error) {
      logger.error('Data cleanup failed:', error);
      throw error;
    }
  }

  async getMetrics() {
    try {
      const [sensorCount] = await sequelize.query('SELECT COUNT(*) as count FROM sensor_data');
      const [logCount] = await sequelize.query('SELECT COUNT(*) as count FROM device_logs');
      const [latestSensor] = await sequelize.query('SELECT MAX(timestamp) as latest FROM sensor_data');
      const [oldestSensor] = await sequelize.query('SELECT MIN(timestamp) as oldest FROM sensor_data');
      
      return {
        sensorDataCount: sensorCount[0].count,
        deviceLogCount: logCount[0].count,
        latestSensorReading: latestSensor[0].latest,
        oldestSensorReading: oldestSensor[0].oldest,
        databaseSize: await this.getDatabaseSize()
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      throw error;
    }
  }

  async getDatabaseSize() {
    try {
      const fs = require('fs').promises;
      const path = sequelize.options.storage;
      
      const stats = await fs.stat(path);
      return {
        bytes: stats.size,
        megabytes: (stats.size / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      logger.warn('Could not get database size:', error);
      return { bytes: 0, megabytes: '0.00' };
    }
  }

  async close() {
    try {
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
}

module.exports = new DatabaseService();