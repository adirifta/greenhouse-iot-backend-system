const request = require('supertest');
const GreenhouseBackend = require('../src/app');
const { sequelize } = require('../src/config/database');
const DeviceLog = require('../src/models/DeviceLog');

// Mock dependencies
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock mqttService
jest.mock('../src/services/mqttService', () => ({
  sendDeviceCommand: jest.fn().mockResolvedValue({ 
    success: true, 
    message: 'Command sent successfully' 
  }),
  getConnectionStatus: jest.fn().mockReturnValue(true)
}));

describe('Device Control API Tests', () => {
  let backend;
  let server;
  let baseUrl;

  beforeAll(async () => {
    console.log('Starting device tests...');
    
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
    if (server) server.close();
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear database
    await DeviceLog.destroy({ where: {}, truncate: true });
    jest.clearAllMocks();
  });

  describe('POST /api/device-control', () => {
    it('should send ON command successfully', async () => {
      const deviceCommand = {
        deviceId: 'fan_1',
        command: 'ON'
      };

      const response = await request(baseUrl)
        .post('/api/device-control')
        .send(deviceCommand)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deviceId).toBe('fan_1');
      expect(response.body.data.command).toBe('ON');
    });
  });
});