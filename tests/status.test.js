const request = require('supertest');
const GreenhouseBackend = require('../src/app'); // TANPA destructuring!
const { sequelize } = require('../src/config/database');

// Mock dependencies
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../src/config/mqtt', () => ({
  isConnected: true
}));

describe('System Status API Tests', () => {
  let backend;
  let server;
  let baseUrl;

  beforeAll(async () => {
    console.log('Starting status tests...');
    
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status', () => {
    it('should return system status', async () => {
      const response = await request(baseUrl)
        .get('/api/status')
        .expect(200);

      expect(response.body.status).toBe('operational');
      expect(response.body.services).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return simple health check', async () => {
      const response = await request(baseUrl)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });
});