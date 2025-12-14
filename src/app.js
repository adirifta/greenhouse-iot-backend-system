require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { connectDB, sequelize } = require('./config/database');
const mqttConfig = require('./config/mqtt');

// Import routes
const sensorRoutes = require('./routes/sensorRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const statusRoutes = require('./routes/statusRoutes');

// Import models for synchronization
const SensorData = require('./models/SensorData');
const DeviceLog = require('./models/DeviceLog');

class GreenhouseBackend {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    this.app.use(helmet());
    
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api', sensorRoutes);
    this.app.use('/api', deviceRoutes);
    this.app.use('/api', statusRoutes);
    
    // Health check route
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Route not found'
      });
    });
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

async initializeDatabase() {
  try {
    await connectDB();
    
    await sequelize.sync({ 
      force: process.env.NODE_ENV === 'development',
      alter: process.env.NODE_ENV === 'development'
    });
    
    logger.info('MySQL database synchronized');

    if (process.env.NODE_ENV === 'development') {
      await this.createTestData();
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize MySQL database:', error);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('Trying SQLite fallback...');
      const { sequelize: sqliteSequelize } = require('./config/database');
      
      try {
        await sqliteSequelize.sync({ alter: true });
        logger.info('SQLite database synchronized as fallback');
        return true;
      } catch (sqliteError) {
        logger.error('SQLite fallback also failed:', sqliteError);
        return false;
      }
    }
    
    return false;
  }
}

async createTestData() {
  try {
    const { SensorData, DeviceLog } = require('./models');
    
    const sensorCount = await SensorData.count();
    const logCount = await DeviceLog.count();
    
    if (sensorCount === 0) {
      await SensorData.bulkCreate([
        {
          sensorId: 'temperature_sensor_1',
          temperature: 25.5,
          humidity: 60.5,
          soilMoisture: 45.0,
          lightIntensity: 800,
          co2Level: 420,
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          sensorId: 'temperature_sensor_2',
          temperature: 23.8,
          humidity: 65.2,
          soilMoisture: 52.0,
          lightIntensity: 950,
          co2Level: 410,
          timestamp: new Date(Date.now() - 1800000)
        }
      ]);
      logger.info('Sample sensor data created');
    }
    
    if (logCount === 0) {
      await DeviceLog.bulkCreate([
        {
          deviceId: 'fan_1',
          command: 'ON',
          topic: 'greenhouse/control/fan_1',
          status: 'SUCCESS',
          timestamp: new Date(Date.now() - 7200000)
        },
        {
          deviceId: 'pump_1',
          command: 'OFF',
          topic: 'greenhouse/control/pump_1',
          status: 'SUCCESS',
          timestamp: new Date(Date.now() - 3600000)
        }
      ]);
      logger.info('Sample device logs created');
    }
    
  } catch (error) {
    logger.error('Failed to create test data:', error);
  }
}

  async start() {
    try {
      const dbInitialized = await this.initializeDatabase();
      if (!dbInitialized) {
        throw new Error('Failed to initialize database');
      }

      mqttConfig.connect();
      
      this.server = this.app.listen(this.port, () => {
        logger.info(`Greenhouse Backend Server running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
      
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');
          
          // Close MQTT connection
          mqttConfig.disconnect();
          logger.info('MQTT connection closed');
          
          // Close database connection
          await sequelize.close();
          logger.info('Database connection closed');
          
          logger.info('Graceful shutdown complete');
          process.exit(0);
        });
      }
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the application
if (require.main === module) {
  const backend = new GreenhouseBackend();
  backend.start();
}

module.exports = GreenhouseBackend;