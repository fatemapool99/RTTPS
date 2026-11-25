const express = require('express');
const router = express.Router();
const {
  getTrainTracking,
  getFleetLocations,
  controlSimulator,
  injectAnomaly
} = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/fleet/all', getFleetLocations);
router.get('/:trainNumber', getTrainTracking);

// Admin-only simulator control and demo triggers
router.post('/simulation/control', protect, authorize('admin'), controlSimulator);
router.post('/simulation/inject', protect, authorize('admin'), injectAnomaly);

module.exports = router;
