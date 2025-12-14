const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'greenhouse_iot',
  logging: msg => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    decimalNumbers: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL database connection established successfully.');

    const [results] = await sequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'greenhouse_iot'}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    ).catch(() => {});
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to MySQL database:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Falling back to SQLite for development...');
      const sqliteSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database/greenhouse.db',
        logging: false
      });
      
      Object.assign(sequelize, sqliteSequelize);
      return true;
    }
    
    return false;
  }
};

module.exports = { sequelize, connectDB };