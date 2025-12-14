const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestDatabase() {
  console.log('Creating test database...');
  
  const rootConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: 'root',
    password: ''
  };

  const testDbName = 'greenhouse_iot_test';
  const appUser = process.env.DB_USER || 'greenhouse_app';
  const appPass = process.env.DB_PASS || '';

  try {
    const connection = await mysql.createConnection(rootConfig);
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${testDbName}\``);
    console.log(`Success Database '${testDbName}' created`);

    try {
      await connection.query(
        `GRANT ALL PRIVILEGES ON \`${testDbName}\`.* TO ?@'localhost'`,
        [appUser]
      );
      console.log(`Success Privileges granted to user '${appUser}'`);
    } catch (grantError) {
      console.log(`Warning Could not grant privileges: ${grantError.message}`);
      console.log(`Info Creating app user if doesn't exist...`);
      
      try {
        await connection.query(
          `CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`,
          [appUser, appPass]
        );
        
        await connection.query(
          `GRANT ALL PRIVILEGES ON \`${testDbName}\`.* TO ?@'localhost'`,
          [appUser]
        );
        
        await connection.query(`FLUSH PRIVILEGES`);
        console.log(`Success App user '${appUser}' created and privileges granted`);
      } catch (userError) {
        console.log(`Warning Using root for testing instead`);
      }
    }
    
    await connection.query(`USE \`${testDbName}\``);
    
    console.log('Creating tables...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sensorId VARCHAR(100) NOT NULL,
        temperature DECIMAL(5,2) NOT NULL,
        humidity DECIMAL(5,2) NOT NULL,
        soilMoisture DECIMAL(5,2),
        lightIntensity DECIMAL(8,2),
        co2Level DECIMAL(8,2),
        timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Success sensor_data table created');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        deviceId VARCHAR(100) NOT NULL,
        command ENUM('ON', 'OFF') NOT NULL,
        topic VARCHAR(255) NOT NULL,
        status ENUM('SUCCESS', 'FAILED') NOT NULL,
        errorMessage TEXT,
        timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Success device_logs table created');
    
    await connection.end();
    console.log('\n Success Test database setup completed!');
    console.log(`Database: ${testDbName}`);
    console.log(`App User: ${appUser}`);
    
  } catch (error) {
    console.error('Error Failed to create test database:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n Tips:');
      console.log('1. Ensure Laragon MySQL is running');
      console.log('2. Try running MySQL as root manually:');
      console.log('   mysql -u root');
      console.log('3. Or check your .env file for correct credentials');
    }
    
    process.exit(1);
  }
}

createTestDatabase();