const models = require('../models');
const SensorData = models.SensorData;
const logger = require('../utils/logger');

class SensorController {
  async storeSensorData(req, res) {
    try {
      const sensorData = req.body;
      
      if (!sensorData.sensorId) {
        return res.status(400).json({
          status: 'error',
          message: 'sensorId is required'
        });
      }
      
      if (typeof sensorData.temperature !== 'number') {
        return res.status(400).json({
          status: 'error',
          message: 'temperature must be a number'
        });
      }
      
      if (typeof sensorData.humidity !== 'number') {
        return res.status(400).json({
          status: 'error',
          message: 'humidity must be a number'
        });
      }

      if (!sensorData.timestamp) {
        sensorData.timestamp = new Date();
      }

      logger.debug('Attempting to create sensor data:', sensorData);
      
      const savedData = await SensorData.create(sensorData);
      
      logger.info(`Sensor data stored successfully: ${sensorData.sensorId}`);
      
      res.status(201).json({
        status: 'success',
        message: 'Sensor data stored successfully',
        data: {
          id: savedData.id,
          sensorId: savedData.sensorId,
          temperature: savedData.temperature,
          humidity: savedData.humidity,
          timestamp: savedData.timestamp
        }
      });
    } catch (error) {
      logger.error('Error storing sensor data:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      
      let errorMessage = 'Failed to store sensor data';
      if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Validation error: ' + error.errors.map(e => e.message).join(', ');
      } else if (error.name === 'SequelizeDatabaseError') {
        errorMessage = 'Database error occurred';
      }
      
      res.status(500).json({
        status: 'error',
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getSensorData(req, res) {
    try {
      const { sensorId, startDate, endDate, limit = 100 } = req.query;
      const where = {};
      
      if (sensorId) {
        where.sensorId = sensorId;
      }
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.$gte = new Date(startDate);
        if (endDate) where.timestamp.$lte = new Date(endDate);
      }
      
      const data = await SensorData.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });
      
      res.json({
        status: 'success',
        count: data.length,
        data: data
      });
    } catch (error) {
      logger.error('Error fetching sensor data:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch sensor data'
      });
    }
  }
}

module.exports = new SensorController();