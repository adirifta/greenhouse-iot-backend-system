const request = require('supertest');
const GreenhouseBackend = require('../src/app');
const { sequelize } = require('../src/config/database');
const SensorData = require('../src/models/SensorData');

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Sensor Data API Tests', () => {
  let backend;
  let server;
  let baseUrl;

  beforeAll(async () => {
    console.log('Starting sensor tests...');
    
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'greenhouse_iot_test';
    
    try {
      // Sync database
      await sequelize.sync({ force: true });
      console.log('Success Database synced for testing');
      
      // Create backend instance
      backend = new GreenhouseBackend();
      server = backend.app.listen(0);
      baseUrl = `http://localhost:${server.address().port}`;
      
      console.log(`Test server running on ${baseUrl}`);
    } catch (error) {
      console.error('Error Setup failed:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    if (server) {
      server.close();
      console.log('Test server stopped');
    }
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await SensorData.destroy({ where: {}, truncate: true });
    jest.clearAllMocks();
  });

  describe('POST /api/sensor-data', () => {
    it('should store valid sensor data successfully', async () => {
      const sensorData = {
        sensorId: 'temp_sensor_1',
        temperature: 25.5,
        humidity: 60.5
      };

      const response = await request(baseUrl)
        .post('/api/sensor-data')
        .send(sensorData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.sensorId).toBe('temp_sensor_1');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        sensorId: 'temp_sensor_1'
        // Missing temperature and humidity
      };

      const response = await request(baseUrl)
        .post('/api/sensor-data')
        .send(incompleteData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});