const mqttService = require('../services/mqttService');
const logger = require('../utils/logger');

class DeviceController {
  async controlDevice(req, res) {
    try {
      const { deviceId, command } = req.body;
      
      if (!deviceId || !command) {
        return res.status(400).json({
          status: 'error',
          message: 'deviceId and command are required'
        });
      }
      
      if (!['ON', 'OFF'].includes(command.toUpperCase())) {
        return res.status(400).json({
          status: 'error',
          message: 'command must be either ON or OFF'
        });
      }

      logger.debug(`Sending device command: ${deviceId} -> ${command}`);
      
      const result = await mqttService.sendDeviceCommand(deviceId, command.toUpperCase());
      
      res.json({
        status: 'success',
        message: result.message,
        data: {
          deviceId,
          command: command.toUpperCase(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error controlling device:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
      let errorMessage = 'Failed to send device command';
      if (error.message.includes('MQTT client not connected')) {
        errorMessage = 'MQTT broker is not connected';
      } else if (error.message.includes('Failed to publish')) {
        errorMessage = 'Failed to send command to MQTT broker';
      }
      
      res.status(500).json({
        status: 'error',
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getDeviceLogs(req, res) {
    try {
      const { DeviceLog } = require('../models');
      const { deviceId, status, startDate, endDate, limit = 100 } = req.query;
      const where = {};
      
      if (deviceId) {
        where.deviceId = deviceId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.$gte = new Date(startDate);
        if (endDate) where.timestamp.$lte = new Date(endDate);
      }
      
      const logs = await DeviceLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });
      
      res.json({
        status: 'success',
        count: logs.length,
        data: logs
      });
    } catch (error) {
      logger.error('Error fetching device logs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch device logs'
      });
    }
  }
}

module.exports = new DeviceController();