const mqtt = require('mqtt');
const logger = require('../utils/logger');

class MQTTConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    
    const options = {
      clientId: `greenhouse-backend-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info(`Connected to MQTT broker at ${brokerUrl}`);
    });

    this.client.on('error', (error) => {
      logger.error('MQTT connection error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('MQTT connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      logger.info('Attempting to reconnect to MQTT broker...');
    });
  }

  publish(topic, message) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error('MQTT client not connected'));
      }

      const messageStr = typeof message === 'object' 
        ? JSON.stringify(message) 
        : message.toString();

      this.client.publish(topic, messageStr, { qos: 1 }, (error) => {
        if (error) {
          logger.error(`Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          logger.info(`Published to ${topic}: ${messageStr}`);
          resolve();
        }
      });
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
    }
  }
}

module.exports = new MQTTConfig();