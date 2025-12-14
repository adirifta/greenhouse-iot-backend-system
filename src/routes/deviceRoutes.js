const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { validateDeviceControl } = require('../middleware/validation');

router.post('/device-control', validateDeviceControl, deviceController.controlDevice);
router.get('/device-logs', deviceController.getDeviceLogs);

module.exports = router;