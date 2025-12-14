const { sensorDataSchema, deviceControlSchema } = require('../utils/validationSchema');
const logger = require('../utils/logger');

const validateSensorData = (req, res, next) => {
  const { error } = sensorDataSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    logger.warn('Sensor data validation failed:', error.details);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

const validateDeviceControl = (req, res, next) => {
  const { error } = deviceControlSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    logger.warn('Device control validation failed:', error.details);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

module.exports = {
  validateSensorData,
  validateDeviceControl
};