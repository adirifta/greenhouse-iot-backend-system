const { connectDB, sequelize } = require('../config/database');
const mqttService = require('../services/mqttService');
const logger = require('../utils/logger');

class StatusController {
  async getSystemStatus(req, res) {
    try {
      let dbStatus = 'disconnected';
      try {
        await sequelize.authenticate();
        dbStatus = 'connected';
      } catch (dbError) {
        logger.error('Database connection check failed:', dbError);
      }

      const mqttStatus = mqttService.getConnectionStatus() ? 'connected' : 'disconnected';

      const systemInfo = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      };
      
      const status = {
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          backend: 'operational',
          database: dbStatus,
          mqtt: mqttStatus
        },
        system: systemInfo
      };

      if (dbStatus === 'disconnected' || mqttStatus === 'disconnected') {
        status.status = 'degraded';
      }
      
      res.json(status);
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get system status'
      });
    }
  }
}

module.exports = new StatusController();