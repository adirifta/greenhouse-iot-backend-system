const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { validateSensorData } = require('../middleware/validation');

router.post('/sensor-data', validateSensorData, sensorController.storeSensorData);
router.get('/sensor-data', sensorController.getSensorData);

module.exports = router;