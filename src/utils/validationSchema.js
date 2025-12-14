const Joi = require('joi');

const sensorDataSchema = Joi.object({
  sensorId: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
  temperature: Joi.number().required().min(-50).max(100),
  humidity: Joi.number().required().min(0).max(100),
  soilMoisture: Joi.number().min(0).max(100).optional(),
  lightIntensity: Joi.number().min(0).optional(),
  co2Level: Joi.number().min(0).optional(),
  timestamp: Joi.date().optional()
});

const deviceControlSchema = Joi.object({
  deviceId: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
  command: Joi.string().required().valid('ON', 'OFF')
});

module.exports = {
  sensorDataSchema,
  deviceControlSchema
};