const mqttConfig = require('../config/mqtt');
const models = require('../models');
const DeviceLog = models.DeviceLog;
const logger = require('../utils/logger');

class MQTTService {
  constructor() {
    this.topicPrefix = 'greenhouse/control/';
  }

  async sendDeviceCommand(deviceId, command) {
    const topic = `${this.topicPrefix}${deviceId}`;
    const payload = {
      deviceId,
      command,
      timestamp: new Date().toISOString()
    };

    try {
      await mqttConfig.publish(topic, payload);
      
      if (DeviceLog && DeviceLog.create) {
        await DeviceLog.create({
          deviceId,
          command,
          topic,
          status: 'SUCCESS'
        });
        logger.info(`Device control command logged to database: ${deviceId} -> ${command}`);
      } else {
        logger.warn('DeviceLog model not available, skipping database logging');
      }

      logger.info(`Device control command sent via MQTT: ${deviceId} -> ${command}`);
      return { success: true, message: 'Command sent successfully' };
    } catch (error) {
      if (DeviceLog && DeviceLog.create) {
        try {
          await DeviceLog.create({
            deviceId,
            command,
            topic,
            status: 'FAILED',
            errorMessage: error.message
          });
        } catch (logError) {
          logger.error('Failed to log device command error:', logError);
        }
      }

      logger.error(`Failed to send device command: ${error.message}`);
      throw new Error(`Failed to send command to device ${deviceId}: ${error.message}`);
    }
  }

  getConnectionStatus() {
    return mqttConfig.isConnected;
  }
}

module.exports = new MQTTService();