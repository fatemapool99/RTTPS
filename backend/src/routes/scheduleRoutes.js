const express = require('express');
const router = express.Router();
const {
  getTrainSchedule,
  updatePlatformNumber,
  overrideEstimatedTime
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:trainNumber', getTrainSchedule);

// Admin-only platform assignment and override
router.patch('/:id/platform', protect, authorize('admin'), updatePlatformNumber);
router.post('/override-eta', protect, authorize('admin'), overrideEstimatedTime);

module.exports = router;
