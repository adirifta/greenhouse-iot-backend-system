const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupMySQL() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'greenhouse_iot'
  };

  console.log('Setting up MySQL database for Greenhouse IoT...');
  console.log('Configuration:', { ...config, password: '***' });

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Success Database '${config.database}' created or already exists`);

    await connection.query(`USE \`${config.database}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sensorId VARCHAR(100) NOT NULL,
        temperature DECIMAL(5,2) NOT NULL,
        humidity DECIMAL(5,2) NOT NULL,
        soilMoisture DECIMAL(5,2),
        lightIntensity DECIMAL(8,2),
        co2Level DECIMAL(8,2),
        timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_sensor_id (sensorId),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        deviceId VARCHAR(100) NOT NULL,
        command ENUM('ON', 'OFF') NOT NULL,
        topic VARCHAR(255) NOT NULL,
        status ENUM('SUCCESS', 'FAILED') NOT NULL,
        errorMessage TEXT,
        timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_device_id (deviceId),
        INDEX idx_timestamp (timestamp),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Success Tables created successfully');

    const appUser = 'greenhouse_app';
    const appPass = 'secure_password_123';
    
    await connection.query(`
      CREATE USER IF NOT EXISTS '${appUser}'@'localhost' IDENTIFIED BY '${appPass}'
    `);
    
    await connection.query(`
      GRANT ALL PRIVILEGES ON \`${config.database}\`.* TO '${appUser}'@'localhost'
    `);
    
    await connection.query(`FLUSH PRIVILEGES`);
    console.log(`Success Application user '${appUser}' created`);

    await connection.end();
    
    console.log('\n MySQL setup completed successfully!');
    console.log('\n Connection Details:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Root User: ${config.user}`);
    console.log(`   App User: ${appUser}`);
    console.log(`   App Password: ${appPass}`);
    
    const fs = require('fs');
    const envPath = '.env';
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');

      if (envContent.includes('DB_USER=')) {
        envContent = envContent.replace(/DB_USER=.*/, `DB_USER=${appUser}`);
      } else {
        envContent += `\nDB_USER=${appUser}`;
      }
      
      if (envContent.includes('DB_PASS=')) {
        envContent = envContent.replace(/DB_PASS=.*/, `DB_PASS=${appPass}`);
      } else {
        envContent += `\nDB_PASS=${appPass}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('\n Success .env file updated with application credentials');
    }
    
  } catch (error) {
    console.error('Error MySQL setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n Warning Laragon MySQL might not be running.');
      console.error('   Please start Laragon and ensure MySQL is running.');
      console.error('   Or check your connection settings in .env file.');
    }
    
    process.exit(1);
  }
}

setupMySQL();